"use strict";

/**
 * Utility RPC provider
 *
 * @module lib/web3/providers/utility_ws
 *
 */

const Web3 = require('web3')
;

const rootPrefix = '../../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , web3UtilityWsProvider = new Web3(coreConstants.OST_UTILITY_GETH_WS_PROVIDER)
;

console.log("utility_ws: coreConstants.OST_UTILITY_GETH_WS_PROVIDER: ",coreConstants.OST_UTILITY_GETH_WS_PROVIDER);
web3UtilityWsProvider.chainId = coreConstants.OST_UTILITY_CHAIN_ID;
web3UtilityWsProvider.chainKind = 'utility';

module.exports = web3UtilityWsProvider;
