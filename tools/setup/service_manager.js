"use strict";
/**
 * Manage openST Platform Services
 *
 * @module tools/setup/service_manager
 */

const shellAsyncCmd = require('node-cmd')
;

const rootPrefix = "../.."
  , setupConfig = require(rootPrefix + '/tools/setup/config')
  , setupHelper = require(rootPrefix + '/tools/setup/helper')
  , gethManager = require(rootPrefix + '/tools/setup/geth_manager')
  , fileManager = require(rootPrefix + '/tools/setup/file_manager')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
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

    // Start intercom processes
  },

  /**
   * Stop all services
   */
  stopServices: function () {
    const oThis = this;

    // Stop geth nodes
    oThis.stopGeth();

    // Stop intercom processes
  },

  /**
   * Start Geth node
   * @params {string} chain - name of the chain
   * @params {string} purpose - if mentioned as deployment, geths will start with zero gas. Else in normal mode
   */
  startGeth: function(chain, purpose) {
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
    fileManager.touch(chainFolder + '/sealer-passphrase', sealerPassword);
    fileManager.touch(chainFolder + "/" + chain + "chain-output.log");

    // start geth
    logger.step("** Starting " + chain + " chain geth node");
    const cmd = "geth --networkid " + networkId + " --datadir " + chainDataDir + " --port " + chainPort +
      " --rpc --rpcapi eth,net,web3,personal --rpcport " + rpcPort + " --rpcaddr " + rpcHost + " --ws" +
      " --wsport " + wsPort + " --wsorigins \"*\" --wsaddr " + wsHost +
      " --mine --targetgaslimit " + gasLimit[chain] + "  --gasprice \"" + gasPrice + "\" --unlock " +
      sealerAddr + " --password "+ chainDataDir +"/sealer-passphrase";
    logger.info(cmd);
    shellAsyncCmd.run(cmd);

    // create geth run script
    logger.step("** Creating run.sh for " + chain + " chain geth node");
    fileManager.touch(chainFolder + "/run.sh", cmd);
  },

  /**
   * Start Geth node
   */
  stopGeth: function() {
    logger.step("** Stopping all geth nodes");
    const cmd = "killall geth";
    shellAsyncCmd.run(cmd);
  },

};

module.exports = new ServiceManagerKlass();
