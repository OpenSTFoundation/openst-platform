"use strict";

/**
 * Utility RPC provider
 *
 * @module lib/web3/providers/value_ws
 *
 */

const Web3 = require('web3')
;

const rootPrefix = '../../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , web3ValueWsProvider = new Web3(coreConstants.OST_VALUE_GETH_WS_PROVIDER)
;

console.log("value_ws: coreConstants.OST_VALUE_GETH_WS_PROVIDER: ",coreConstants.OST_VALUE_GETH_WS_PROVIDER);
web3ValueWsProvider.chainId = coreConstants.OST_VALUE_CHAIN_ID;
web3ValueWsProvider.chainKind = 'value';

module.exports = web3ValueWsProvider;
