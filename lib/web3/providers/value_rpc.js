"use strict";

const Web3 = require('web3')
;

const rootPrefix = '../../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , web3ValueRpcProvider = new Web3(coreConstants.OST_GETH_VALUE_RPC_PROVIDER)
;

module.exports = web3ValueRpcProvider;
