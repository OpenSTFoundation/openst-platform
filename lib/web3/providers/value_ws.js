"use strict";

const Web3 = require('web3')
;

const rootPrefix = '../../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , web3ValueWsProvider = new Web3(coreConstants.OST_GETH_VALUE_WS_PROVIDER)
;

module.exports = web3ValueWsProvider;
