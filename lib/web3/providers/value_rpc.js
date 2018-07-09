"use strict";

/**
 * Utility RPC provider
 *
 * @module lib/web3/providers/value_rpc
 *
 */

const OSTBase = require("@openstfoundation/openst-base")
;

const rootPrefix = '../../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , OstWeb3 = OSTBase.OstWeb3Pool
;

Object.defineProperty(module, 'exports', {
  get: function () {
    let web3ValueRpcProvider = OstWeb3.Factory.getWeb3(coreConstants.OST_VALUE_GETH_RPC_PROVIDER);
    web3ValueRpcProvider.chainId = coreConstants.OST_VALUE_CHAIN_ID;
    web3ValueRpcProvider.chainKind = 'value';

    return web3ValueRpcProvider;
  }
});