'use strict';

/**
 * Utility RPC provider
 *
 * @module lib/web3/providers/utility_rpc
 *
 */

const OSTBase = require('@openstfoundation/openst-base');

const rootPrefix = '../../..',
  coreConstants = require(rootPrefix + '/config/core_constants'),
  OstWeb3Pool = OSTBase.OstWeb3Pool;

Object.defineProperty(module, 'exports', {
  get: function() {
    let web3UtilityRpcProvider = OstWeb3Pool.Factory.getWeb3(coreConstants.OST_UTILITY_GETH_RPC_PROVIDER);
    web3UtilityRpcProvider.chainId = coreConstants.OST_UTILITY_CHAIN_ID;
    web3UtilityRpcProvider.chainKind = 'utility';

    return web3UtilityRpcProvider;
  }
});
