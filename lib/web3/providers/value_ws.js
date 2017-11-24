"use strict";

const coreConstants = require('../../../config/core_constants');

const Web3 = require('web3')
  , web3ValueWsProvider = new Web3(coreConstants.OST_GETH_VALUE_WS_PROVIDER);

module.exports = web3ValueWsProvider;
