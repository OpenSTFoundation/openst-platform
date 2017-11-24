"use strict";

const rootPrefix = "../.."
  , web3RpcProvider = require(rootPrefix+"/lib/web3/providers/value_rpc")
  , helper = require("./helper")
  , contractName = "valueRegistrar"
  , coreConstants = require(rootPrefix+"/config/core_constants")
  , coreAddresses = require(rootPrefix+"/config/core_addresses")
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract( contractAbi )
  , responseHelper = require(rootPrefix+"/lib/formatter/response")
;

currContract.setProvider( web3RpcProvider.currentProvider );

const ValueRegistrar = module.exports = function (contractAddress) {
  this.contractAddress = contractAddress;
}

ValueRegistrar.prototype = {

  setOpsAddress: async function (senderName, opsAddress) {

    const encodeABI = currContract.methods.setOpsAddress(opsAddress).encodeABI();

    const transactionReceipt = await helper.safeSend(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderName,
      { gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
    );

    return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));

  }

};

