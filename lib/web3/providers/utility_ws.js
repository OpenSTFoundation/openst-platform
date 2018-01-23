"use strict";

const Web3 = require('web3')
;

const rootPrefix = '../../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , web3UtilityWsProvider = new Web3(coreConstants.OST_GETH_UTILITY_WS_PROVIDER)
;

module.exports = web3UtilityWsProvider;
