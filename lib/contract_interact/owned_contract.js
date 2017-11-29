"use strict";

const rootPrefix = '../..'
  , helper = require('./helper')
  , coreConstants = require(rootPrefix+'/config/core_constants')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , responseHelper = require(rootPrefix+'/lib/formatter/response')
;

//currContract.setProvider( web3RpcProvider.currentProvider );

const OwnedContract = module.exports = function (contractAddress, web3RpcProvider, currContract, defaultGasPrice) {
  this.contractAddress = contractAddress;
  this.web3RpcProvider = web3RpcProvider;
  this.currContract = currContract;
  this.defaultGasPrice = defaultGasPrice;
  this.currContract.options.address = contractAddress;
  this.currContract.setProvider( web3RpcProvider.currentProvider );

};

OwnedContract.prototype = {

  initiateOwnerShipTransfer: async function(senderName, proposedOwner, customOptions){

    const encodedABI = this.currContract.methods.initiateOwnershipTransfer(proposedOwner).encodeABI();

    var options = { gasPrice: this.defaultGasPrice };

    Object.assign(options,customOptions);

    const transactionResponse = await helper.safeSend(
      this.web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderName,
      options
    );

    return Promise.resolve(transactionResponse);

  },

  getOwner: async function(){

    const transactionObject = this.currContract.methods.proposedOwner();
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs( transactionObject );
    const response = await helper.call(this.web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(responseHelper.successWithData({owner: response[0]}));
  },


};

