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
  , web3UtilityRpcProvider = new Web3(coreConstants.OST_GETH_UTILITY_RPC_PROVIDER);

module.exports = web3UtilityRpcProvider;
