"use strict";

/**
 * Utility RPC provider
 *
 * @module lib/web3/providers/utility_rpc
 *
 */

const OSTBase = require("@openstfoundation/openst-base");

const rootPrefix = '../../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , OstWeb3 = OSTBase.OstWeb3
;

const web3UtilityRpcProvider = new OstWeb3(coreConstants.OST_UTILITY_GETH_RPC_PROVIDER);

web3UtilityRpcProvider.chainId = coreConstants.OST_UTILITY_CHAIN_ID;
web3UtilityRpcProvider.chainKind = 'utility';

module.exports = web3UtilityRpcProvider;
