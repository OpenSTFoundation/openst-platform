"use strict";
/**
 * Manage openST Platform Services
 *
 * @module tools/setup/service_manager
 */

const shell = require('shelljs')
;

const rootPrefix = "../.."
  , setupConfig = require(rootPrefix + '/tools/setup/config')
  , setupHelper = require(rootPrefix + '/tools/setup/helper')
  , gethManager = require(rootPrefix + '/tools/setup/geth_manager')
  , fileManager = require(rootPrefix + '/tools/setup/file_manager')
  , coreConstants = require(rootPrefix + '/config/core_constants')
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
   * @params {string} purpose - if mentioned as deployment, geths will start with zero gas. Else in normal mode
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
    for (var chain in setupConfig.chains) {
      oThis.startGeth(chain);
    }

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
      , gasPrice = {utility: (purpose === 'deployment') ? zeroGas : coreConstants.OST_UTILITY_GAS_PRICE, value: coreConstants.OST_VALUE_GAS_PRICE}
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

    const cmd = "nohup geth --networkid " + networkId + " --datadir " + chainDataDir + " --port " + chainPort +
      " --rpc --rpcapi eth,net,web3,personal --rpcport " + rpcPort + " --rpcaddr " + rpcHost + " --ws" +
      " --wsport " + wsPort + " --wsorigins \"*\" --wsaddr " + wsHost +
      " --mine --targetgaslimit " + gasLimit[chain] + "  --gasprice \"" + gasPrice[chain] + "\" --unlock " +
      sealerAddr + " --password "+ chainDataDir +"/sealer-passphrase  >> " + chainDataDir + "/" + chain + "chain-output.log &";

    oThis._exec(cmd);
  },

  /**
   * Start Geth node
   */
  stopGeth: function(chain) {
  },

  /**
   * Execute any shell command command
   *
   * @param {string} command - raw command
   */
  _exec: function(command) {
    return shell.exec(command, {async: true});
  }

};

module.exports = new ServiceManagerKlass();
