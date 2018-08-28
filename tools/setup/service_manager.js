'use strict';
/**
 * Manage openST Platform Services
 *
 * @module tools/setup/service_manager
 */

const shellAsyncCmd = require('node-cmd'),
  shellSource = require('shell-source'),
  Path = require('path');

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  setupConfig = require(rootPrefix + '/tools/setup/config'),
  setupHelper = require(rootPrefix + '/tools/setup/helper'),
  fileManager = require(rootPrefix + '/tools/setup/file_manager'),
  logger = require(rootPrefix + '/helpers/custom_console_logger');

require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/tools/setup/geth_manager');

const sealerPassphraseFile = 'sealer-passphrase';

/**
 * Constructor for service manager
 *
 * @constructor
 */
const ServiceManagerKlass = function(configStrategy, instanceComposer) {};

ServiceManagerKlass.prototype = {
  /**
   * Start all services for given purpose
   *
   * @params {string} purpose - if mentioned as deployment, geth will start with zero gas. Else in normal mode
   */
  startServices: function(purpose) {
    const oThis = this;

    // Start geth nodes
    for (var chain in setupConfig.chains) {
      oThis.startGeth(chain, purpose);
    }
  },

  /**
   * Stop all geth nodes and executables
   */
  stopServices: function() {
    const oThis = this;

    // Stop All geth nodes
    oThis.stopAllGeth();

    // Stop all executables
    oThis.stopExecutable();
  },

  /**
   * Stop Value Chain Services
   */
  stopValueServices: function() {
    const oThis = this;

    // Stop geth nodes
    oThis.stopValueGeth();
  },

  /**
   * Stop Utility Chain Services
   */
  stopUtilityServices: function() {
    const oThis = this;

    // Stop Utility chain geth nodes
    oThis.stopUtilityGeth();

    // Stop all executables
    oThis.stopUtilityExecutable();
  },

  /**
   * Start Geth node
   * @params {string} chain - name of the chain
   * @params {string} purpose - if mentioned as deployment, geths will start with zero gas. Else in normal mode
   */

  startGeth: async function(chain, purpose) {
    const oThis = this;

    // start geth
    logger.info('* Starting ' + chain + ' chain');
    const cmd = oThis._startGethCommand(chain, purpose);
    logger.info(cmd);
    shellAsyncCmd.run(cmd);

    const sleep = function(ms) {
      return new Promise(function(resolve) {
        setTimeout(resolve, ms);
      });
    };

    const cmd1 = ' tail -1000  ' + setupHelper.setupFolderAbsolutePath() + '/logs/value-chain-2001.log ';
    logger.info(cmd1);

    await sleep(3000);

    shellAsyncCmd.get(cmd1, function(err, data, stderr) {
      console.log('============== tail log ================: \n\n', data);
    });
  },

  /**
   * Stop All Geth nodes
   */
  stopAllGeth: function() {
    logger.info('* Stopping all running geths');
    const cmd =
      "ps -ef | grep 'openst-setup\\|openst-platform' | grep 'geth ' |  grep -v grep | awk '{print $2}' | xargs kill";
    shellAsyncCmd.run(cmd);
  },

  /**
   * Stop Value Geth node
   */
  stopValueGeth: function() {
    logger.info('* Stopping all running utility geths');
    const cmd =
      "ps -ef | grep 'openst-setup\\|openst-platform' | grep 'openst-geth-value-" +
      setupHelper.valueChainId() +
      "' |  grep -v grep | awk '{print $2}' | xargs kill";
    shellAsyncCmd.run(cmd);
  },

  /**
   * Stop Utility Geth node
   */
  stopUtilityGeth: function() {
    logger.info('* Stopping all running utility geths');
    const cmd =
      "ps -ef | grep 'openst-setup\\|openst-platform' | grep 'openst-geth-utility-" +
      setupHelper.utilityChainId() +
      "' |  grep -v grep | awk '{print $2}' | xargs kill";
    shellAsyncCmd.run(cmd);
  },

  /**
   * Start executable
   *
   * @param {string} executablePath - relative path of the executable file
   *
   * @return {promise}
   */
  startExecutable: function(executablePath) {
    const oThis = this,
      envFilePath = setupHelper.setupFolderAbsolutePath() + '/' + setupConfig.env_vars_file;

    return new Promise(function(onResolve, onReject) {
      // source env
      shellSource(envFilePath, function(err) {
        if (err) {
          throw err;
        }

        logger.info('* Starting executable:', executablePath);
        const cmd = oThis._startExecutableCommand(executablePath);
        logger.info(cmd);
        shellAsyncCmd.run(cmd);

        logger.info('* Waiting for 10 seconds for executable to start.');
        setTimeout(function() {
          onResolve(Promise.resolve());
        }, 10000);
      });
    });
  },

  /**
   * Stop executables
   */
  stopExecutable: function() {
    logger.info('* Stopping all running executable');
    const cmd =
      "ps -ef | grep 'openst-setup\\|openst-platform' | grep 'executables' |  grep -v grep | awk '{print $2}' | xargs kill";
    shellAsyncCmd.run(cmd);
  },

  /**
   * Stop Utility executables
   */
  stopUtilityExecutable: function() {
    logger.info('* Stopping all running utility executable');
    const cmd =
      "ps -ef | grep 'openst-setup\\|openst-platform' | grep 'executables' | " +
      "grep 'utility-chain-" +
      setupHelper.utilityChainId() +
      "' |  grep -v grep | awk '{print $2}' | xargs kill";
    shellAsyncCmd.run(cmd);
  },

  /**
   * Post platform setup
   */
  postSetupSteps: function() {
    const oThis = this;

    // create geth run script
    for (let chain in setupConfig.chains) {
      let utilityChainBinFolder = setupHelper.utilityChainBinFilesFolder(),
        cmd = oThis._startGethCommand(chain, ''),
        gethRunScript = 'run-' + chain + '.sh';

      if (chain == 'utility') {
        fileManager.touch(utilityChainBinFolder + '/' + gethRunScript, '#!/bin/sh');
        fileManager.append(utilityChainBinFolder + '/' + gethRunScript, cmd);
        logger.info(
          '* Start ' +
            chain +
            ' chain: sh ' +
            setupHelper.setupFolderAbsolutePath() +
            '/' +
            utilityChainBinFolder +
            '/' +
            gethRunScript
        );
      } else {
        fileManager.touch('/' + setupHelper.binFolder() + '/' + gethRunScript, '#!/bin/sh');
        fileManager.append('/' + setupHelper.binFolder() + '/' + gethRunScript, cmd);
        logger.info(
          '* Start ' +
            chain +
            ' chain: sh ' +
            setupHelper.setupFolderAbsolutePath() +
            '/' +
            setupHelper.binFolder() +
            '/' +
            gethRunScript
        );
      }
    }

    // Generate executables
    const intercomProcessIdentifiers = setupHelper.intercomProcessIdentifiers();
    for (let i = 0; i < intercomProcessIdentifiers.length; i++) {
      let intercomIdentifier = intercomProcessIdentifiers[i],
        utilityChainBinFolder = setupHelper.utilityChainBinFilesFolder(),
        absoluteBinFolderPath = setupHelper.setupFolderAbsolutePath() + '/' + utilityChainBinFolder,
        executablePath = 'executables/inter_comm/' + intercomIdentifier + '.js',
        intercomProcessDataFile =
          setupHelper.setupFolderAbsolutePath() +
          '/' +
          setupHelper.utilityChainDataFilesFolder() +
          '/' +
          intercomIdentifier +
          '.data',
        cmd = oThis._startExecutableCommand(
          executablePath + ' ' + intercomProcessDataFile + ' ' + setupHelper.configStrategyUtilityFilePath()
        ),
        runScript = 'run-' + intercomIdentifier + '.sh';

      fileManager.touch(utilityChainBinFolder + '/' + runScript, '#!/bin/sh');
      console.log("echo '" + cmd + "' >> " + absoluteBinFolderPath + '/' + runScript);
      shellAsyncCmd.run("echo '" + cmd + "' >> " + absoluteBinFolderPath + '/' + runScript);
      logger.info('* Start ' + intercomIdentifier + ' intercomm: sh ' + absoluteBinFolderPath + '/' + runScript);
    }

    //Make Utility gas price to default after deployment
    let cmd =
      'export ' +
      setupConfig.chains.utility.gas_price.env_var +
      '=' +
      "'" +
      setupConfig.chains.utility.gas_price.value +
      "'";
    fileManager.append(setupConfig.env_vars_file, cmd);
  },

  /**
   * Start executable script command
   *
   * @params {string} executablePath - relative path of the executable file
   *
   * @return {string}
   * @private
   */
  _startExecutableCommand: function(executablePath) {
    let logFilename = executablePath
      .split(' ')[0]
      .split('/')
      .slice(-1)[0]
      .split('.')[0];
    return (
      'node $OPENST_PLATFORM_PATH/' +
      executablePath +
      ' >> ' +
      setupHelper.setupFolderAbsolutePath() +
      '/' +
      setupHelper.utilityChainLogsFilesFolder() +
      '/executables-' +
      logFilename +
      '.log'
    );
  },

  /**
   * Start geth command
   *
   * @params {string} chain - name of the chain
   * @params {string} purpose - if mentioned as deployment, geths will start with zero gas. Else in normal mode
   *
   * @return {string}
   * @private
   */
  _startGethCommand: function(chain, purpose) {
    const oThis = this,
      gethManager = oThis.ic().getSetupGethManager(),
      coreConstants = oThis.ic().getCoreConstants(),
      chainDetails = setupConfig.chains[chain],
      networkId = chainDetails['network_id'].value,
      chainPort = chainDetails['port'].value,
      zeroGas = coreConstants.OST_UTILITY_GAS_PRICE_FOR_DEPLOYMENT,
      gasLimit = { utility: coreConstants.OST_UTILITY_GAS_LIMIT, value: coreConstants.OST_VALUE_GAS_LIMIT },
      gasPrice = purpose === 'deployment' && chain === 'utility' ? zeroGas : chainDetails.gas_price.value,
      chainFolder = setupHelper.gethFolderFor(chain),
      chainDataDir = setupHelper.setupFolderAbsolutePath() + '/' + setupHelper.gethFolderFor(chain),
      sealerPassword = setupConfig.addresses['sealer'].passphrase.value,
      rpcProviderHostPort = chainDetails.rpc_provider.value.replace('http://', '').split(':'),
      rpcHost = rpcProviderHostPort[0],
      rpcPort = rpcProviderHostPort[1],
      wsProviderHostPort = chainDetails.ws_provider.value.replace('ws://', '').split(':'),
      wsHost = wsProviderHostPort[0],
      wsPort = wsProviderHostPort[1];

    const sealerAddr = gethManager.getGeneratedAddressByName('sealer');

    // creating password file in a temp location
    fileManager.touch(chainFolder + '/' + sealerPassphraseFile, sealerPassword);

    return (
      'geth --networkid ' +
      networkId +
      ' --datadir ' +
      chainDataDir +
      ' --port ' +
      chainPort +
      ' --rpc --rpcapi eth,net,web3,personal,txpool --wsapi eth,net,web3,personal,txpool --rpcport ' +
      rpcPort +
      ' --rpcaddr ' +
      rpcHost +
      ' --ws' +
      ' --wsport ' +
      wsPort +
      " --wsorigins '*' --wsaddr " +
      wsHost +
      ' --etherbase ' +
      sealerAddr +
      ' --mine --minerthreads 1 --targetgaslimit ' +
      gasLimit[chain] +
      '  --gasprice "' +
      gasPrice +
      '" --unlock ' +
      sealerAddr +
      ' --password ' +
      chainDataDir +
      '/' +
      sealerPassphraseFile +
      ' 2> ' +
      setupHelper.logsFolderAbsolutePath() +
      '/' +
      chain +
      '-chain-' +
      setupHelper.chainIdFor(chain) +
      '.log'
    );
  }
};

//getSetupServiceManager
InstanceComposer.register(ServiceManagerKlass, 'getSetupServiceManager', true);

module.exports = ServiceManagerKlass;
