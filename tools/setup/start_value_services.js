'use strict';
/**
 * Start Value Chain Specific Services
 *
 * @module tools/setup/start_value_services.js
 */

const shellAsyncCmd = require('node-cmd');

// load shelljs and disable output
let shell = require('shelljs');
shell.config.silent = true;

const rootPrefix = '../..',
  startServicesHelper = require(rootPrefix + '/tools/setup/start_services_helper'),
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  StartDynamo = require(rootPrefix + '/lib/start_dynamo');

const args = process.argv,
  configStrategyFilePath = args[2];

require(rootPrefix + '/services/utils/value_chain_status');

const configStrategy = configStrategyFilePath
    ? require(configStrategyFilePath)
    : require(startServicesHelper.configStrategyFilePath()),
  instanceComposer = new InstanceComposer(configStrategy),
  ValueChainStatusKlass = instanceComposer.getValueChainStatusService();

/**
 * Constructor for start value chain services
 *
 * @constructor
 */
const StartValueServicesKlass = function() {};

StartValueServicesKlass.prototype = {
  /**
   * Start all value chain services
   */
  perform: async function() {
    const oThis = this,
      servicesList = [];

    let cmd = "ps aux | grep dynamo | grep java | grep -v grep | tr -s ' ' | cut -d ' ' -f2";
    let processId = shell.exec(cmd).stdout;

    if (processId === '') {
      // Start Dynamo DB in openST env
      let startDynamo = new StartDynamo();
      await startDynamo.perform();
    }

    // Start Value Chain
    logger.step('** Start value chain');
    cmd =
      'sh ' + startServicesHelper.setupFolderAbsolutePath() + '/' + startServicesHelper.binFolder() + '/run-value.sh';
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
    const statusObj = new ValueChainStatusKlass(),
      servicesResponse = await statusObj.perform();
    if (servicesResponse.isFailure()) {
      logger.error('* Error ', servicesResponse);
      process.exit(1);
    } else {
      logger.info('* Value Chain:', servicesResponse.data.chain.value);
    }

    logger.win(
      '\n** Congratulations! All value chain related services are up and running. \n' +
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

const services = new StartValueServicesKlass();
services.perform();
