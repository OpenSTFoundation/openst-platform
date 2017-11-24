"use strict";

const rootPrefix = "../.."
  , web3RpcProvider = require(rootPrefix+"/lib/web3/providers/utility_rpc")
  , helper = require("./helper")
  , contractName = 'registrar'
  , coreConstants = require(rootPrefix+"/config/core_constants")
  , coreAddresses = require(rootPrefix+"/config/core_addresses")
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract( contractAbi )
  , responseHelper = require(rootPrefix+"/lib/formatter/response")
  ;

currContract.setProvider( web3RpcProvider.currentProvider );

const UtilityRegistrar = module.exports = function (contractAddress) {
  this.contractAddress = contractAddress;
}

UtilityRegistrar.prototype = {

  setOpsAddress: async function(senderName, opsAddress){

    console.log("opsAddress ===> "+ opsAddress);
    const encodedABI = currContract.methods.setOpsAddress(opsAddress).encodeABI();
    const transactionReceipt = await helper.safeSend(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderName,
      { gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
    );
    return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));

  },

  initiateOwnerShipTransfer: async function(senderName, proposedOwner){
    console.log("initiateOwnerShipTransfer proposedOwner: "+ proposedOwner);
    const encodedABI = currContract.methods.initiateOwnershipTransfer(proposedOwner).encodeABI();
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

