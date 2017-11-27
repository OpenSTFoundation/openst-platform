"use strict";

const rootPrefix = '../..'
  , web3RpcProvider = require(rootPrefix+'/lib/web3/providers/utility_rpc')
  , helper = require(rootPrefix+'/lib/contract_interact/helper')
  , contractName = 'openSTUtility'
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContractAddr = coreAddresses.getAddressForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract( contractAbi )
  , responseHelper = require(rootPrefix+'/lib/formatter/response')
  , coreConstants = require(rootPrefix+'/config/core_constants')
  ;

//currContract.setProvider( web3RpcProvider.currentProvider );

const OpenStUtilityContractInteract = module.exports = function (contractAddress) {
  this.contractAddress = contractAddress;
};

OpenStUtilityContractInteract.prototype = {

  getSimpleTokenPrimeContractAddress: async function() {
    const encodedABI = currContract.methods.simpleTokenPrime().encodeABI();
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, ['address']);
    return Promise.resolve(responseHelper.successWithData({simpleTokenPrimeContractAddress: response[0]}));
  },

  getSimpleTokenPrimeUUID: async function() {
    const encodedABI = currContract.methods.uuidSTPrime().encodeABI();
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI);
    return Promise.resolve(responseHelper.successWithData({simpleTokenPrimeUUID: response}));
  },

  initiateOwnerShipTransfer: async function(senderName, proposedOwner){
    console.log("initiateOwnerShipTransfer proposedOwner: "+ proposedOwner);
    const encodedABI = currContract.methods.initiateOwnershipTransfer(proposedOwner).encodeABI();
    const response = await helper.safeSend(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderName,
      { gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
    );
    return Promise.resolve(response);

  },

  processMinting: async function(reserveAddress, reservePassphrase, stakingIntentHash){

    const encodedABI = currContract.methods.processMinting(stakingIntentHash).encodeABI();

    const transactionReceipt = await helper.safeSendFromAddr(
      web3RpcProvider,
      currContractAddr,
      encodedABI,
      reserveAddress,
      reservePassphrase,
      { gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
    );

    //return => tokenAddress;
    return Promise.resolve(transactionReceipt);

  },

  getSymbol: async function(){
    const encodedABI = currContract.methods.STPRIME_SYMBOL().encodeABI();
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI);
    return Promise.resolve(responseHelper.successWithData({symbol: response}));
  },

  getName: async function(){
    const encodedABI = currContract.methods.STPRIME_NAME().encodeABI();
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI);
    return Promise.resolve(responseHelper.successWithData({name: response}));
  },

  getConversationRate: async function(){
    const encodedABI = currContract.methods.STPRIME_CONVERSION_RATE().encodeABI();
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI);
    return Promise.resolve(responseHelper.successWithData({conversion_rate: response}));
  },

  proposeBrandedToken: async function(senderAddress, senderPassphrase, symbol, name, conversionRate) {

    const encodedABI = currContract.methods.proposeBrandedToken(symbol, name, conversionRate).encodeABI();
    const transactionReceiptResult = await helper.safeSendFromAddr(
      web3RpcProvider,
      currContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      { gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
    );

    return Promise.resolve(transactionReceiptResult);

  },

  registerBrandedToken: async function(senderAddress, senderPassphrase, symbol, name, conversionRate, requester, brandedToken, checkUuid){

    const encodedABI = currContract.methods.registerBrandedToken(symbol, name, conversionRate, requester, brandedToken, checkUuid).encodeABI();
    const transactionReceiptResult = await helper.safeSendFromAddr(
      web3RpcProvider,
      currContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      { gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
    );

    return Promise.resolve(transactionReceiptResult);

  }


};