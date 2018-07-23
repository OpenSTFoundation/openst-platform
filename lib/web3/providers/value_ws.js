"use strict";

/**
 * Utility WS provider
 *
 * @module lib/web3/providers/value_ws
 *
 */

const OSTBase = require("@openstfoundation/openst-base")
;

const rootPrefix = '../../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , OstWeb3Pool = OSTBase.OstWeb3Pool
;

Object.defineProperty(module, 'exports', {
  get: function () {
    let web3ValueWsProvider = OstWeb3Pool.Factory.getWeb3(coreConstants.OST_VALUE_GETH_WS_PROVIDER);
    web3ValueWsProvider.chainId = coreConstants.OST_VALUE_CHAIN_ID;
    web3ValueWsProvider.chainKind = 'value';
    
    return web3ValueWsProvider;
  }
});
