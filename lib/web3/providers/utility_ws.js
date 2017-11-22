"use strict";

const coreConstants = require('../../../config/core_constants');

const Web3 = require('web3')
  , web3UtilityWsProvider = new Web3(coreConstants.OST_GETH_UTILITY_WS_PROVIDER);

module.exports = web3UtilityWsProvider;
