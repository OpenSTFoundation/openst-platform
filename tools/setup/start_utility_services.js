'use strict';
/**
 * Start All openST Platform Services
 *
 * @module tools/setup/start_utility_services.js
 */

const shellAsyncCmd = require('node-cmd');

// load shelljs and disable output
let shell = require('shelljs');
shell.config.silent = true;

const rootPrefix = '../..',
  startServicesHelper = require(rootPrefix + '/tools/setup/start_services_helper'),
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/helpers/custom_console_logger');

const args = process.argv,
  configStrategyFilePath = args[2];

if (!configStrategyFilePath) {
  logger.error(
    'Please pass the config strategy for the utility chain. Run the code as: \nnode tools/setup/start_utility_services.js "utility_chain_config_strategy_file_path"'
  );
  process.exit(1);
}

require(rootPrefix + '/services/utils/utility_chain_status');

const configStrategy = require(configStrategyFilePath),
  instanceComposer = new InstanceComposer(configStrategy),
  UtilityChainStatusKlass = instanceComposer.getUtilityChainStatusService(),
  utilityChainId = configStrategy.OST_UTILITY_CHAIN_ID;

/**
 * Constructor for start services
 *
 * @constructor
 */
const StartServicesKlass = function() {};

StartServicesKlass.prototype = {
  /**
   * Start all platform services
   */
  perform: async function() {
    const oThis = this,
      servicesList = [];

    // Start Utility Chain
    logger.step('** Start utility chain');
    let cmd =
      'sh ' +
      startServicesHelper.setupFolderAbsolutePath() +
      '/' +
      startServicesHelper.utilityChainBinFilesFolder(utilityChainId) +
      '/run-utility.sh';
    servicesList.push(cmd);
    oThis._asyncCommand(cmd);

    // Wait for 5 seconds for geth to come up
    const sleep = function(ms) {
      return new Promise(function(resolve) {
        setTimeout(resolve, ms);
      });
    };
    await sleep(5000);

    // Check geths are up and running
    logger.step('** Check chains are up and responding');
    const statusObj = new UtilityChainStatusKlass(),
      servicesResponse = await statusObj.perform();
    if (servicesResponse.isFailure()) {
      logger.error('* Error ', servicesResponse);
      process.exit(1);
    } else {
      logger.info('Utility Chain:', servicesResponse.data.chain.utility);
    }

    // Start intercom processes in openST env
    logger.step('** Start stake and mint inter-communication process');
    cmd =
      'sh ' +
      startServicesHelper.setupFolderAbsolutePath() +
      '/' +
      startServicesHelper.utilityChainBinFilesFolder(utilityChainId) +
      '/run-stake_and_mint.sh';
    servicesList.push(cmd);
    oThis._asyncCommand(cmd);

    logger.step('** Start register branded token inter-communication process');
    cmd =
      'sh ' +
      startServicesHelper.setupFolderAbsolutePath() +
      '/' +
      startServicesHelper.utilityChainBinFilesFolder(utilityChainId) +
      '/run-register_branded_token.sh';
    servicesList.push(cmd);
    oThis._asyncCommand(cmd);

    // Start intercom processes in OST env
    logger.step('** Start stake and mint processor');
    cmd =
      'sh ' +
      startServicesHelper.setupFolderAbsolutePath() +
      '/' +
      startServicesHelper.utilityChainBinFilesFolder(utilityChainId) +
      '/run-stake_and_mint_processor.sh';
    servicesList.push(cmd);
    oThis._asyncCommand(cmd);

    logger.win(
      '\n** Congratulation! All utility chain services are up and running. \n' +
        'NOTE: We will keep monitoring the services, and notify you if any service stops.'
    );

    // Check all services are running
    oThis._uptime(servicesList);
  },

  /**
   * Run async command
   *
   * @params {string} cmd - command to start the service
   * @private
   */
  _asyncCommand: function(cmd) {
    const oThis = this;
    logger.info(cmd);
    shellAsyncCmd.run(cmd);
  },

  /**
   * Check if all services are up and running
   *
   * @params {array} cmds - Array of all running service commands
   * @private
   */
  _uptime: function(cmds) {
    setInterval(function() {
      for (let i = 0; i < cmds.length; i++) {
        let processID = (shell.exec("ps -ef | grep '" + cmds[i] + "' | grep -v grep | awk '{print $2}'") || {}).stdout;
        if (processID === '') {
          logger.error('* Process stopped:', cmds[i], ' Please restart the services.');
        }
      }
    }, 5000);
  }
};

// Start the platform services
logger.error(Array(30).join('='));
logger.error(
  'Note: For scalability and security reasons, this script should only be used in ' +
    startServicesHelper.allowedEnvironment().join(' and ') +
    ' environments.'
);
logger.error(Array(30).join('='));

const services = new StartServicesKlass();
services.perform();
