"use strict";
/**
 * Start the OpenST Setup
 */

const rootPrefix = "../.."
  , setupConfig = require(rootPrefix + '/tools/setup/config')
  , fileManager = require(rootPrefix + '/tools/setup/file_manager')
  , gethManager = require(rootPrefix + '/tools/setup/geth_manager')
  , serviceManager = require(rootPrefix + '/tools/setup/service_manager')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

const args = process.argv
  , environment = args[2]
  , environments = ['development', 'test']
;

const performer = async function () {

  // Stop running services
  logger.step("** Stop openST services");
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

  // Cleanup build files
  logger.step("** Cleaning temporary build files");
  gethManager.buildCleanup();

  // Exit
  // process.exit(1);

};

if (!environments.includes(environment)) {
  logger.error("** Usages: node tools/setup/index.js <environment>");
  logger.info("** Note: For scalibity reasons, step tools should only be used in " + environments.join(' and ') +' environments.');
} else {
  performer();
}
