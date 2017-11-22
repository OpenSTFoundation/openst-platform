"use strict";

const coreConstants = require('../../../config/core_constants');

const Web3 = require('web3')
  , web3ValueRpcProvider = new Web3(coreConstants.OST_GETH_VALUE_RPC_PROVIDER);

module.exports = web3ValueRpcProvider;
