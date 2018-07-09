"use strict";

/**
 * Utility WS provider
 *
 * @module lib/web3/providers/utility_ws
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
    let web3UtilityWsProvider = OstWeb3Pool.Factory.getWeb3(coreConstants.OST_UTILITY_GETH_WS_PROVIDER);
    web3UtilityWsProvider.chainId = coreConstants.OST_UTILITY_CHAIN_ID;
    web3UtilityWsProvider.chainKind = 'utility';

    return web3UtilityWsProvider;
  }
});
