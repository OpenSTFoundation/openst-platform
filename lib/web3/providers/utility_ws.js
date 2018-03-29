"use strict";

/**
 * Utility WS provider
 *
 * @module lib/web3/providers/utility_ws
 *
 */

const OstCore = require("@openstfoundation/openst-core")
;

const rootPrefix = '../../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , OstWeb3       = OstCore.OstWeb3
;

const web3UtilityWsProvider = new OstWeb3(coreConstants.OST_UTILITY_GETH_WS_PROVIDER, null, {
  providerOptions: {
    maxReconnectTries: 20,
    killOnReconnectFailuer: false
  }
});

web3UtilityWsProvider.chainId = coreConstants.OST_UTILITY_CHAIN_ID;
web3UtilityWsProvider.chainKind = 'utility';

module.exports = web3UtilityWsProvider;
