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
  , spinnerHelper = require(rootPrefix + '/tools/setup/spinner')
  , fileManager = require(rootPrefix + '/tools/setup/file_manager')
  , gethManager = require(rootPrefix + '/tools/setup/geth_manager')
  , serviceManager = require(rootPrefix + '/tools/setup/service_manager')
  , envManager = require(rootPrefix + '/tools/setup/env_manager')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

const performer = async function () {

  // Stop running services
  logger.step("** Stopping openST services");
  serviceManager.stopServices();

  // Cleanup old step
  logger.step("** Starting fresh setup by cleaning up old step");
  fileManager.freshSetup();

  // generate all required addresses
  logger.step("** Generating all required account keystore files at temp location");
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

  // Chains have started mining
  logger.step("** Checking if chains have started generating blocks");
  spinnerHelper.start();
  await runHelperService(rootPrefix + '/tools/setup/geth_checker');
  spinnerHelper.stop();

  // Fund required addresses
  logger.step('** Funding required addresses');
  await runHelperService(rootPrefix + '/tools/setup/fund_users');

  // Deploy Simple Token Contract and update ENV
  const stDeployResponse = await runHelperService(rootPrefix + '/tools/setup/simple_token/deploy');
  setupConfig.contracts['simpleToken'].address.value = stDeployResponse.data.address;
  envManager.generateEnvFile();

  // Finalize Simple Token Contract
  await runHelperService(rootPrefix + '/tools/setup/simple_token/finalize');

  // Fund required addresses
  logger.step('** Funding required addresses with ST');
  await runHelperService(rootPrefix + '/tools/setup/fund_users_with_st');

  // Deploy Value Registrar Contract and update ENV
  const valueRegistrarDeployResponse = await runHelperService(rootPrefix + '/tools/deploy/value_registrar');
  setupConfig.contracts['valueRegistrar'].address.value = valueRegistrarDeployResponse.data.address;
  envManager.generateEnvFile();

  // Deploy OpenST Value Contract and update ENV
  const openSTValueDeployResponse = await runHelperService(rootPrefix + '/tools/deploy/openst_value');
  setupConfig.contracts['openSTValue'].address.value = openSTValueDeployResponse.data.address;
  envManager.generateEnvFile();

  // Deploy Utility Registrar Contract and update ENV
  const utilityRegistrarDeployResponse = await runHelperService(rootPrefix + '/tools/deploy/utility_registrar');
  setupConfig.contracts['utilityRegistrar'].address.value = utilityRegistrarDeployResponse.data.address;
  envManager.generateEnvFile();

  // Deploy OpenST Utility Contract and update ENV
  const openSTUtilityDeployResponse = await runHelperService(rootPrefix + '/tools/deploy/openst_utility');
  setupConfig.contracts['openSTUtility'].address.value = openSTUtilityDeployResponse.data.address;
  envManager.generateEnvFile();

  // Deploy OpenST Utility Contract and update ENV
  const stPrimeDeploymentStepsResponse = await runHelperService(rootPrefix + '/tools/deploy/st_prime');
  setupConfig.contracts['stPrime'].address.value = stPrimeDeploymentStepsResponse.data.address;
  setupConfig.misc_deployment.st_prime_uuid.value = stPrimeDeploymentStepsResponse.data.uuid;
  envManager.generateEnvFile();

  // Deploy Value Core Contract and update ENV
  const valueCoreDeployResponse = await runHelperService(rootPrefix + '/tools/deploy/value_core');
  setupConfig.contracts['valueCore'].address.value = valueCoreDeployResponse.data.address;
  envManager.generateEnvFile();

  // Deploy Value Core Contract and update ENV
  await runHelperService(rootPrefix + '/tools/deploy/register_st_prime');

  // Starting stake and mint intercomm
  logger.step("** Starting stake and mint intercomm");
  await serviceManager.startExecutable(rootPrefix + '/executables/inter_comm/stake_and_mint.js');

  // Starting stake and mint processor intercomm
  logger.step("** Starting stake and mint processor intercomm");
  await serviceManager.startExecutable(rootPrefix + '/executables/inter_comm/stake_and_mint_processor.js');

  // Stake and mint simple token prime
  await runHelperService(rootPrefix + '/tools/setup/stake_and_mint_simple_token_prime');

  // Fund required addresses
  logger.step('** Funding required addresses with ST Prime');
  await runHelperService(rootPrefix + '/tools/setup/fund_users_with_st_prime');

  // Cleanup build files
  logger.step("** Cleaning temporary build files");
  gethManager.buildCleanup();

  // Stop running services
  logger.step("** Stopping openST services");
  serviceManager.stopServices();

  // Print all the helpful scripts post setup
  logger.step("** OpenST Platform created following executables for further usages:");
  logger.info(Array(30).join("="));
  serviceManager.postSetupSteps();

  // Exit
  process.exit(0);
};

/**
 * Run the deployer helper service
 *
 * @param {string} deployPath - contract deployment script path
 *
 * @return {promise}
 */
const runHelperService = function(deployPath) {
  const envFilePath = setupHelper.setupFolderAbsolutePath() + '/' + setupConfig.env_vars_file
    , clearCacheOfExpr = /(openst-platform\/config\/)|(openst-platform\/lib\/)/;

  return new Promise(function (onResolve, onReject) {
    // source env
    shellSource(envFilePath, async function(err){
      if (err) { throw err;}
      Object.keys(require.cache).forEach(function(key) {
        if (key.search(clearCacheOfExpr) !== -1) {
          delete require.cache[key];
        }
      });

      const setupHelper = require(deployPath);
      return onResolve(await setupHelper.perform());
    });
  });

};

// Start the platform setup
logger.error(Array(30).join("="));
logger.error("Note: For scalability and security reasons, step tools should only be used in " + setupHelper.allowedEnvironment().join(' and ') +' environments.');
logger.error(Array(30).join("="));

performer();
