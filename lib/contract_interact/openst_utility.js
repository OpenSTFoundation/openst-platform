"use strict";

const web3RpcProvider = require('../web3/providers/utility_rpc')
  , helper = require('./helper')
  , contractName = 'openSTUtility'
  , coreAddresses = require('../../config/core_addresses')
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract( contractAbi )
  , responseHelper = require('../../lib/formatter/response')
  ;

//currContract.setProvider( web3RpcProvider.currentProvider );

const OpenStUtilityContractInteract = module.exports = function (contractAddress) {
  this.contractAddress = contractAddress;
};

OpenStUtilityContractInteract.prototype = {

  getSimpleTokenPrimeContractAddress: async function(){
    const encodedABI = currContract.methods.simpleTokenPrime.encodeABI();
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodeABI);
    return Promise.resolve(responseHelper.successWithData({simpleTokenPrimeContractAddress: response}));
  },

  getSimpleTokenPrimeUUID: async function(){
    const encodedABI = currContract.methods.uuidSTPrime.encodeABI();
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodeABI);
    return Promise.resolve(responseHelper.successWithData({simpleTokenPrimeUUID: response}));
  },

  processMinting: async function(senderName, stakingIntentHash){

    const encodedABI = currContract.methods.processMinting(stakingIntentHash).encodeABI();

    const transactionReceipt = await helper.safeSend(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderName,
      { gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
    );

    //return => tokenAddress;
    return Promise.resolve(transactionReceipt);

  }


};