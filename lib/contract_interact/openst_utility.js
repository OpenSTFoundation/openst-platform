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
  , UC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE
;


const OpenStUtilityContractInteract = module.exports = function (contractAddress) {
  contractAddress = contractAddress || currContractAddr;
  this.contractAddress = contractAddress;

  console.log("OpenStUtilityContractInteract :: contractAddress" , contractAddress);
  
  currContract.options.address = contractAddress;
  currContract.setProvider( web3RpcProvider.currentProvider );
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
      { gasPrice: coreConstants.OST_VALUE_GAS_PRICE }
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
      { gasPrice: coreConstants.OST_VALUE_GAS_PRICE }
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


    //Calculate gas required for proposing branded token.
    const gasToUse = await currContract.methods.proposeBrandedToken(symbol, name, conversionRate).estimateGas({
      from: senderAddress,
      gasPrice: UC_GAS_PRICE
    });



    const encodedABI = currContract.methods.proposeBrandedToken(symbol, name, conversionRate).encodeABI();
    console.log( "proposeBrandedToken :: gasToUse", gasToUse, "symbol", symbol, "name", name, "conversionRate", conversionRate);


    const transactionReceiptResult = await helper.safeSendFromAddr(
      web3RpcProvider,
      currContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      { 
        gasPrice: UC_GAS_PRICE,
        gas: gasToUse 
      }
    );

    return Promise.resolve(transactionReceiptResult);
  },

  registerBrandedToken: async function(senderAddress, senderPassphrase, symbol, name, conversionRate, requester, brandedToken, checkUuid){

    //Calculate gas required for proposing branded token.
    const gasToUse = await currContract.methods
      .registerBrandedToken(symbol, name, 
        conversionRate,  requester, 
        brandedToken, checkUuid)
          .estimateGas({
            from: senderAddress,
            gasPrice: UC_GAS_PRICE
          });

    console.log( "registerBrandedToken inputs"
      , "gasToUse", gasToUse
      , "symbol", symbol
      , "name", name
      , "conversionRate", conversionRate
      , "requester", requester
      , "brandedToken", brandedToken
      , "checkUuid", checkUuid
    );

    const encodedABI = currContract.methods.registerBrandedToken(symbol, name, conversionRate, requester, brandedToken, checkUuid).encodeABI();
    const transactionReceiptResult = await helper.safeSendFromAddr(
      web3RpcProvider,
      currContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      { 
        gasPrice: UC_GAS_PRICE, 
        gas: gasToUse
      }
    );

    return Promise.resolve(transactionReceiptResult);

  },

  confirmStakingIntent: async function(
    senderAddress,
    senderPassphrase,
    stakerAddr,
    stakerNonce,
    beneficiary,
    amountST,
    amountUT,
    stakingUnlockHeight,
    stakingIntentHash
  ) {

    const encodedABI = currContract.methods.confirmStakingIntent(
      stakerAddr,
      stakerNonce,
      beneficiary,
      amountST,
      amountUT,
      stakingUnlockHeight,
      stakingIntentHash
    ).encodeABI();

    const transactionReceiptResult = await helper.safeSendFromAddr(
      web3RpcProvider,
      currContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {
        gasPrice: UC_GAS_PRICE
      }
    );

    return Promise.resolve(transactionReceiptResult);

  }

};