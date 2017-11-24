"use strict";

const web3RpcProvider = require('../web3/providers/utility_rpc')
  , helper = require('./helper')
  , contractName = 'openSTUtility'
  , coreConstants = require('../../config/core_constants')
  , coreAddresses = require('../../config/core_addresses')
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract( contractAbi )
  , responseHelper = require('../../lib/formatter/response')
  ;

currContract.setProvider( web3RpcProvider.currentProvider );

const UtilityTokenContractInteract = module.exports = function () {

}

UtilityTokenContractInteract.prototype = {

};