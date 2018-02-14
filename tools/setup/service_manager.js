"use strict";
/**
 * Manage openST Platform Services
 *
 * @module tools/setup/service_manager
 */

const shellAsyncCmd = require('node-cmd')
  , shellSource = require('shell-source')
  , Path = require('path')
;

const rootPrefix = "../.."
  , setupConfig = require(rootPrefix + '/tools/setup/config')
  , setupHelper = require(rootPrefix + '/tools/setup/helper')
  , gethManager = require(rootPrefix + '/tools/setup/geth_manager')
  , fileManager = require(rootPrefix + '/tools/setup/file_manager')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

const sealerPassphraseFile = "sealer-passphrase"
;

/**
 * Constructor for service manager
 *
 * @constructor
 */
const ServiceManagerKlass = function () {};

ServiceManagerKlass.prototype = {
  /**
   * Start all services for given purpose
   *
   * @params {string} purpose - if mentioned as deployment, geth will start with zero gas. Else in normal mode
   */
  startServices: function (purpose) {
    const oThis = this;

    // Start geth nodes
    for (var chain in setupConfig.chains) {
      oThis.startGeth(chain, purpose);
    }
  },

  /**
   * Stop all services
   */
  stopServices: function () {
    const oThis = this;

    // Stop geth nodes
    oThis.stopGeth();

    // Stop all executables
    oThis.stopExecutable();
  },

  /**
   * Start Geth node
   * @params {string} chain - name of the chain
   * @params {string} purpose - if mentioned as deployment, geths will start with zero gas. Else in normal mode
   */
  startGeth: function(chain, purpose) {
    const oThis = this
    ;

    // start geth
    logger.info("* Starting " + chain + " chain");
    const cmd = oThis._startGethCommand(chain, purpose);
    logger.info(cmd);
    shellAsyncCmd.run(cmd);
  },

  /**
   * Start Geth node
   */
  stopGeth: function() {
    logger.info("* Stopping all running geths");
    const cmd = "ps -ef | grep 'openst-setup\\|openst-platform' | grep 'geth ' |  grep -v grep | awk '{print $2}' | xargs kill";
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
    const oThis = this
      , envFilePath = setupHelper.setupFolderAbsolutePath() + '/' + setupConfig.env_vars_file;

    return new Promise(function (onResolve, onReject) {
      // source env
      shellSource(envFilePath, function(err) {
        if (err) { throw err;}

        logger.info('* Starting executable:', executablePath);
        const cmd = oThis._startExecutableCommand(executablePath);
        logger.info(cmd);
        shellAsyncCmd.run(cmd);

        logger.info('* Waiting for 10 seconds for executable to start.');
        setTimeout(function(){ onResolve(Promise.resolve()) }, 10000);
      });
    });
  },

  /**
   * Stop executables
   */
  stopExecutable: function() {
    logger.info("* Stopping all running executable");
    const cmd = "ps -ef | grep 'openst-setup\\|openst-platform' | grep 'executables' |  grep -v grep | awk '{print $2}' | xargs kill";
    shellAsyncCmd.run(cmd);
  },

  /**
   * Post platform setup
   */
  postSetupSteps: function() {
    const oThis = this
    ;

    logger.info("* Source environment values: source " + setupHelper.setupFolderAbsolutePath() + "/" + setupConfig.env_vars_file);

    // create geth run script
    for (var chain in setupConfig.chains) {
      var binFolder = setupHelper.binFolder()
        , cmd = oThis._startGethCommand(chain, '')
        , gethRunScript = "run-" + chain + ".sh"
      ;
      fileManager.touch(binFolder + "/" + gethRunScript, '#!/bin/sh');
      fileManager.append(binFolder + "/" + gethRunScript, cmd);
      logger.info("* Start " + chain + " chain: sh " + setupHelper.setupFolderAbsolutePath() + "/" + binFolder + "/" + gethRunScript);
    }

    // Generate executables
    const intercommExes = ["redeem_and_unstake.js", "redeem_and_unstake_processor.js", "register_branded_token.js",
      "stake_and_mint.js", "stake_and_mint_processor.js"];
    for (var i=0; i < intercommExes.length; i++) {
      var binFolder = setupHelper.binFolder()
        , executablePath = rootPrefix + '/executables/inter_comm/' + intercommExes[i]
        , execName = executablePath.split('/').slice(-1)[0].split('.')[0]
        , cmd = oThis._startExecutableCommand(executablePath)
        , runScript = "run-" + execName + ".sh"

      fileManager.touch(binFolder + "/" + runScript, '#!/bin/sh');
      fileManager.append(binFolder + "/" + runScript, cmd);
      logger.info("* Start " + intercommExes[i] + " intercomm: sh " + setupHelper.setupFolderAbsolutePath() + "/" + binFolder + "/" + runScript);
    }
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
    var logFilename = executablePath.split('/').slice(-1)[0].split('.')[0];
    return 'node ' + Path.join(__dirname) + '/' + executablePath + ' >> ' +
      setupHelper.logsFolderAbsolutePath() + '/executables-' + logFilename + '.log'
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
    const oThis = this
      , chainDetails = setupConfig.chains[chain]
      , networkId = chainDetails['network_id'].value
      , chainPort = chainDetails['port'].value
      , zeroGas = coreConstants.OST_UTILITY_GAS_PRICE_FOR_DEPLOYMENT
      , gasLimit = {utility: coreConstants.OST_UTILITY_GAS_LIMIT, value: coreConstants.OST_VALUE_GAS_LIMIT}
      , gasPrice = (purpose === 'deployment' && chain == 'utility') ? zeroGas : chainDetails.gas_price.value
      , chainFolder = gethManager.getChainDataFolder(chain)
      , chainDataDir = gethManager.getChainAbsoluteDataDir(chain)
      , sealerAddr = setupConfig.addresses['sealer'].address.value
      , sealerPassword = setupConfig.addresses['sealer'].passphrase.value
      , rpcProviderHostPort = chainDetails.rpc_provider.value.replace("http://", "").split(":")
      , rpcHost = rpcProviderHostPort[0]
      , rpcPort = rpcProviderHostPort[1]
      , wsProviderHostPort = chainDetails.ws_provider.value.replace("ws://", "").split(":")
      , wsHost = wsProviderHostPort[0]
      , wsPort = wsProviderHostPort[1]
    ;

    // creating password file in a temp location
    fileManager.touch(chainFolder + '/' + sealerPassphraseFile, sealerPassword);

    return "geth --networkid " + networkId + " --datadir " + chainDataDir + " --port " + chainPort +
      " --rpc --rpcapi eth,net,web3,personal --rpcport " + rpcPort + " --rpcaddr " + rpcHost + " --ws" +
      " --wsport " + wsPort + " --wsorigins '*' --wsaddr " + wsHost + " --etherbase " + sealerAddr +
      " --mine --minerthreads 1 --targetgaslimit " + gasLimit[chain] + "  --gasprice \"" + gasPrice + "\" --unlock " +
      sealerAddr + " --password "+ chainDataDir + "/" + sealerPassphraseFile + " 2> " +
      setupHelper.logsFolderAbsolutePath() + "/chain-" + chain + ".log";
  }

};

module.exports = new ServiceManagerKlass();
