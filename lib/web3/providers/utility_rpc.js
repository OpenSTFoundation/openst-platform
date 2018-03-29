"use strict";

/**
 * Utility RPC provider
 *
 * @module lib/web3/providers/utility_rpc
 *
 */

const OstCore = require("@openstfoundation/openst-core");

const rootPrefix = '../../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , OstWeb3       = OstCore.OstWeb3
;

const web3UtilityRpcProvider = new OstWeb3(coreConstants.OST_UTILITY_GETH_RPC_PROVIDER, null, {
  providerOptions: {
    maxReconnectTries: 20,
    killOnReconnectFailure: false
  }
});

web3UtilityRpcProvider.chainId = coreConstants.OST_UTILITY_CHAIN_ID;
web3UtilityRpcProvider.chainKind = 'utility';

module.exports = web3UtilityRpcProvider;
