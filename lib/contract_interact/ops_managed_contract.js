"use strict";

const rootPrefix = '../..'
  , helper = require('./helper')
  , coreConstants = require(rootPrefix+'/config/core_constants')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , responseHelper = require(rootPrefix+'/lib/formatter/response')
  , OwnedContract = require('./owned_contract')
;

//currContract.setProvider( web3RpcProvider.currentProvider );

const OpsManagedContract = module.exports = function (contractAddress, web3RpcProvider, currContract, defaultGasPrice) {
  this.contractAddress = contractAddress;
  this.web3RpcProvider = web3RpcProvider;
  this.currContract = currContract;
  this.defaultGasPrice = defaultGasPrice;
  this.currContract.options.address = contractAddress;
  this.currContract.setProvider( web3RpcProvider.currentProvider );
  OwnedContract.call(this, contractAddress, web3RpcProvider, currContract, defaultGasPrice);
};

OpsManagedContract.prototype = Object.create(OwnedContract.prototype);

OpsManagedContract.prototype.constructor = OpsManagedContract;

OpsManagedContract.prototype.getOpsAddress = async function() {
  const transactionObject = this.currContract.methods.opsAddress();
  const encodedABI = transactionObject.encodeABI();
  const transactionOutputs = helper.getTransactionOutputs( transactionObject );
  const response = await helper.call(this.web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
  return Promise.resolve(responseHelper.successWithData({address: response[0]}));
};

OpsManagedContract.prototype.setOpsAddress = async function(senderName, opsAddress) {
  const encodedABI = this.currContract.methods.setOpsAddress(opsAddress).encodeABI();

  const transactionReceipt = await helper.safeSend(
    this.web3RpcProvider,
    this.contractAddress,
    encodedABI,
    senderName,
    { gasPrice: this.defaultGasPrice }
  );

  return Promise.resolve(transactionReceipt);
};

