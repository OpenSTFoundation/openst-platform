"use strict";

const web3RpcProvider = require('../web3/providers/utility_rpc')
  , helper = require('./helper')
  , contractName = 'STPrime'
  , coreAddresses = require('../../config/core_addresses')
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract( contractAbi )
  , responseHelper = require('../../lib/formatter/response')
  ;

currContract.setProvider( web3RpcProvider.currentProvider );

const UtilityPrimeContractInteract = module.exports = function (contractAddress) {
  this.contractAddress = contractAddress;
}

UtilityPrimeContractInteract.prototype = {

  initialize: function(senderName){
    const encodedABI = currContract.methods.initialize().encodeABI();
    const transactionReceipt = await helper.safeSend(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderName,
      { gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
    );
    return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));
  },


};