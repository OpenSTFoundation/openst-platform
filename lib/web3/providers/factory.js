"use strict";

/**
 * Web3 Provider Factory
 *
 * @module lib/web3/providers/factory
 */

const rootPrefix = '../../..'
;

/**
 * Constructor for Deploy Utility Registrar contract
 *
 * @constructor
 */
const Web3ProviderFactoryKlass = function () {};

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
  getProvider: function(chain, type){
    const oThis = this;
    if(oThis.valueChain === chain){
      if(oThis.typeRPC === type){
        return require(rootPrefix + '/lib/web3/providers/value_ws');
      } else if(oThis.typeWS === type){
        return require(rootPrefix + '/lib/web3/providers/value_ws');
      }
    } else if(oThis.utilityChain === chain){
      if(oThis.typeRPC === type){
        return require(rootPrefix + '/lib/web3/providers/utility_ws');
      } else if(oThis.typeWS === type){
        return require(rootPrefix + '/lib/web3/providers/utility_ws');
      }
    }
    return null;
  }
};

module.exports = new Web3ProviderFactoryKlass();