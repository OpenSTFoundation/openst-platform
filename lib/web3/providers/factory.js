'use strict';

/**
 * Web3 Provider Factory
 *
 * @module lib/web3/providers/factory
 */

const OSTBase = require('@openstfoundation/openst-base');

const rootPrefix = '../../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  OstWeb3Pool = OSTBase.OstWeb3Pool;

require(rootPrefix + '/config/core_constants');

/**
 * Constructor for Deploy Utility Registrar contract
 *
 * @constructor
 */
const Web3ProviderFactoryKlass = function(configStrategy, instanceComposer) {};

Web3ProviderFactoryKlass.prototype = {
  /**
   * Type RPC
   *
   * @constant {string}
   *
   */
  typeRPC: 'rpc',

  /**
   * Type WS
   *
   * @constant {string}
   *
   */
  typeWS: 'ws',

  /**
   * Utility chain
   *
   * @constant {string}
   *
   */
  utilityChain: 'utility',

  /**
   * Value chain
   *
   * @constant {string}
   *
   */
  valueChain: 'value',

  /**
   * Perform
   *
   * @param {string} chain - chain name - value / utility
   * @param {string} type - provider type - ws / rpc
   *
   * @return {web3Provider}
   */
  getProvider: function(chain, type) {
    const oThis = this;
    if (oThis.valueChain === chain) {
      if (oThis.typeRPC === type) {
        return oThis.getValueRpcProvider();
      } else if (oThis.typeWS === type) {
        return oThis.getValueWsProvider();
      }
    } else if (oThis.utilityChain === chain) {
      if (oThis.typeRPC === type) {
        return oThis.getUtilityRpcProvider();
      } else if (oThis.typeWS === type) {
        return oThis.getUtilityWsProvider();
      }
    }
    return null;
  },

  getValueRpcProvider: function() {
    const oThis = this,
      coreConstants = oThis.ic().getCoreConstants();

    let web3 = OstWeb3Pool.Factory.getWeb3(coreConstants.OST_VALUE_GETH_RPC_PROVIDER);
    web3.chainId = coreConstants.OST_VALUE_CHAIN_ID;
    web3.chainKind = 'value';

    return web3;
  },

  getValueWsProvider: function() {
    const oThis = this,
      coreConstants = oThis.ic().getCoreConstants();

    let web3 = OstWeb3Pool.Factory.getWeb3(coreConstants.OST_VALUE_GETH_WS_PROVIDER);
    web3.chainId = coreConstants.OST_VALUE_CHAIN_ID;
    web3.chainKind = 'value';

    return web3;
  },

  getUtilityRpcProvider: function() {
    const oThis = this,
      coreConstants = oThis.ic().getCoreConstants();

    let web3 = OstWeb3Pool.Factory.getWeb3(coreConstants.OST_UTILITY_GETH_RPC_PROVIDER);
    web3.chainId = coreConstants.OST_UTILITY_CHAIN_ID;
    web3.chainKind = 'utility';

    return web3;
  },

  getUtilityWsProvider: function() {
    const oThis = this,
      coreConstants = oThis.ic().getCoreConstants();

    let web3 = OstWeb3Pool.Factory.getWeb3(coreConstants.OST_UTILITY_GETH_WS_PROVIDER);
    web3.chainId = coreConstants.OST_UTILITY_CHAIN_ID;
    web3.chainKind = 'utility';

    return web3;
  }
};

InstanceComposer.register(Web3ProviderFactoryKlass, 'getWeb3ProviderFactory', true);

module.exports = Web3ProviderFactoryKlass;
