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
  , VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE
;

currContract.setProvider( web3RpcProvider.currentProvider );

const ValueRegistrar = module.exports = function (contractAddress) {
  this.contractAddress = contractAddress;

  console.log("ValueRegistrar :: contractAddress" , contractAddress);
  
  currContract.options.address = contractAddress;
  currContract.setProvider( web3RpcProvider.currentProvider );

};

ValueRegistrar.prototype = {

  setOpsAddress: async function (senderName, opsAddress) {

    const encodedABI = currContract.methods.setOpsAddress(opsAddress).encodeABI();

    const transactionReceipt = await helper.safeSend(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderName,
      { gasPrice: VC_GAS_PRICE }
    );

    return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));

  },

  initiateOwnerShipTransfer: async function(senderName, proposedOwner){

    const encodedABI = currContract.methods.initiateOwnershipTransfer(proposedOwner).encodeABI();

    const transactionReceipt = await helper.safeSend(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderName,
      { gasPrice: VC_GAS_PRICE }
    );

    return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));
  },

  addCore: async function(senderName, registry, coreContractAddress){

    const encodedABI = currContract.methods.addCore(registry, coreContractAddress).encodeABI();

    const transactionReceipt = await helper.safeSend(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderName,
      { gasPrice: VC_GAS_PRICE }
    );

    return Promise.resolve(transactionReceipt);

  },

  registerUtilityToken: async function(senderAddress, senderPassphrase, registry, symbol, name, conversionRate, utilityChainId, requester, checkUuid){
    const oThis = this;
    //Calculate gas required for proposing branded token.
    const gasToUse = await currContract.methods
      .registerUtilityToken( 
        registry, 
        symbol, 
        name, 
        conversionRate,  
        utilityChainId, 
        requester, 
        checkUuid)
          .estimateGas({
            from: senderAddress,
            gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE
          });

    console.log( "\nregisterUtilityToken inputs"
      , "\n\tgasToUse", gasToUse
      , "\n\tregistry", registry
      , "\n\tsymbol", symbol
      , "\n\tname", name
      , "\n\tconversionRate", conversionRate
      , "\n\tutilityChainId", utilityChainId
      , "\n\trequester", requester
      , "\n\tcheckUuid", checkUuid
    );

    const encodedABI = currContract.methods.registerUtilityToken(
      registry, 
      symbol, 
      name, 
      conversionRate, 
      utilityChainId, 
      requester, 
      checkUuid).encodeABI();
    const transactionReceiptResult = await helper.safeSendFromAddr(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderAddress,
      senderPassphrase,
      { 
        gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE, 
        gas: gasToUse
      }
    );

    return Promise.resolve(transactionReceiptResult);

  }

};

