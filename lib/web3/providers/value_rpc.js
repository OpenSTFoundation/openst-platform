"use strict";

/**
 * Utility RPC provider
 *
 * @module lib/web3/providers/value_rpc
 *
 */

const Web3 = require('web3')
;

const rootPrefix = '../../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , web3ValueRpcProvider = new Web3(coreConstants.OST_VALUE_GETH_RPC_PROVIDER)
;

web3ValueRpcProvider.chainId = coreConstants.OST_VALUE_CHAIN_ID;
web3ValueRpcProvider.chainKind = 'value';

module.exports = web3ValueRpcProvider;
