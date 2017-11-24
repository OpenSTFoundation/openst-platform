"use strict";

const coreConstants = require('../../../config/core_constants');

const Web3 = require('web3')
  , web3UtilityRpcProvider = new Web3(coreConstants.OST_GETH_UTILITY_RPC_PROVIDER);

module.exports = web3UtilityRpcProvider;
