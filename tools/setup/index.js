"use strict";
/**
 * Start the OpenST Setup
 */
const shellSource = require('shell-source')
  , Path = require('path')
;

const rootPrefix = "../.."
  , setupConfig = require(rootPrefix + '/tools/setup/config')
  , setupHelper = require(rootPrefix + '/tools/setup/helper')
  , fileManager = require(rootPrefix + '/tools/setup/file_manager')
  , gethManager = require(rootPrefix + '/tools/setup/geth_manager')
  , serviceManager = require(rootPrefix + '/tools/setup/service_manager')
  , envManager = require(rootPrefix + '/tools/setup/env_manager')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

const args = process.argv
  , environment = args[2]
  , environments = ['development', 'test']
;

const performer = async function () {

  // Stop running services
  logger.step("** Stopping openST services");
  serviceManager.stopServices();

  // Cleanup old step
  logger.step("** Starting fresh setup by cleaning up old step");
  fileManager.freshSetup();

  // generate all required addresses
  logger.step("** Generate all required account keystore files at temp location");
  gethManager.generateConfigAddresses();

  // Modify genesis files and init chains
  for (var chain in setupConfig.chains) {
    logger.step("** Initiating " + chain +" chain and generating/modifying genesis files");
    gethManager.initChain(chain);
  }

  // Copy addresses to required chains
  logger.step("** Copying keystore files from temp location to required chains");
  gethManager.copyKeystoreToChains();

  // Start services for deployment
  logger.step("** Starting openST services for deployment");
  serviceManager.startServices('deployment');

  // Write environment file
  logger.step("** Writing env variables file");
  envManager.generateEnvFile();

  // Deploy Simple Token Contract and update ENV
  const stDeployResponse = await deployContract(rootPrefix + '/tools/setup/simple_token/deploy');
  setupConfig.contracts['simpleToken'].address.value = stDeployResponse.data.address;
  envManager.generateEnvFile();

  // Finalize Simple Token Contract
  await deployContract(rootPrefix + '/tools/setup/simple_token/finalize');

  // Deploy Value Registrar Contract and update ENV
  const valueRegistrarDeployResponse = await deployContract(rootPrefix + '/tools/deploy/value_registrar');
  setupConfig.contracts['valueRegistrar'].address.value = valueRegistrarDeployResponse.data.address;
  envManager.generateEnvFile();

  // Deploy OpenST Value Contract and update ENV
  const openSTValueDeployResponse = await deployContract(rootPrefix + '/tools/deploy/openst_value');
  setupConfig.contracts['openSTValue'].address.value = openSTValueDeployResponse.data.address;
  envManager.generateEnvFile();

  // Deploy Utility Registrar Contract and update ENV
  const utilityRegistrarDeployResponse = await deployContract(rootPrefix + '/tools/deploy/utility_registrar');
  setupConfig.contracts['utilityRegistrar'].address.value = utilityRegistrarDeployResponse.data.address;
  envManager.generateEnvFile();

  // Deploy OpenST Utility Contract and update ENV
  const openSTUtilityDeployResponse = await deployContract(rootPrefix + '/tools/deploy/openst_utility');
  setupConfig.contracts['openSTUtility'].address.value = openSTUtilityDeployResponse.data.address;
  envManager.generateEnvFile();


  // Cleanup build files
  logger.step("** Cleaning temporary build files");
  gethManager.buildCleanup();

  // Exit
  process.exit(1);
};

/**
 * Source the new ENV file and reload core addresses
 *
 * @param {string} deployPath - contract deployment script path
 */
const deployContract = function(deployPath) {
  const envFilePath = setupHelper.testFolderAbsolutePath() + '/' + setupConfig.env_vars_file;

  return new Promise(function (onResolve, onReject) {
    // source env
    shellSource(envFilePath, async function(err){
      if (err) { throw err;}
      // reload core constants
      delete require.cache[require.resolve(rootPrefix + '/config/core_constants')];
      //const coreConstants = require(rootPrefix + '/config/core_constants');
      // reload core addresses
      delete require.cache[require.resolve(rootPrefix + '/config/core_addresses')];
      //const coreConstants = require(rootPrefix + '/config/core_constants');
      // deploy contract
      const deployer = require(deployPath);
      return onResolve(await deployer.perform());
    });
  });

};

if (!environments.includes(environment)) {
  logger.error("** Usages: node tools/setup/index.js <environment>");
  logger.info("** Note: For scalibity reasons, step tools should only be used in " + environments.join(' and ') +' environments.');
} else {
  performer();
}
