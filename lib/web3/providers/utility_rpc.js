"use strict";

/**
 * Utility RPC provider
 *
 * @module lib/web3/providers/utility_rpc
 *
 */

const Web3 = require('web3')
;

const rootPrefix = '../../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , web3UtilityRpcProvider = new Web3(coreConstants.OST_UTILITY_GETH_RPC_PROVIDER);

console.log("utility_rpc: coreConstants.OST_UTILITY_GETH_RPC_PROVIDER: ",coreConstants.OST_UTILITY_GETH_RPC_PROVIDER);
web3UtilityRpcProvider.chainId = coreConstants.OST_UTILITY_CHAIN_ID;
web3UtilityRpcProvider.chainKind = 'utility';

module.exports = web3UtilityRpcProvider;
