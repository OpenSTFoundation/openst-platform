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
  , OwnedContract = require("./owned_contract")
  , UC_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE
;

const OpenStUtilityContractInteract = module.exports = function (contractAddress) {

  contractAddress = contractAddress || currContractAddr;

  this.contractAddress = contractAddress;

  console.log("OpenStUtilityContractInteract :: contractAddress" , contractAddress);
  
  currContract.options.address = contractAddress;
  currContract.setProvider( web3RpcProvider.currentProvider );

  OwnedContract.call(this, contractAddress, web3RpcProvider, currContract, UC_GAS_PRICE)

};

OpenStUtilityContractInteract.prototype = Object.create(OwnedContract.prototype);

OpenStUtilityContractInteract.prototype.constructor = OpenStUtilityContractInteract;

OpenStUtilityContractInteract.prototype.getSimpleTokenPrimeContractAddress = async function() {
  const encodedABI = currContract.methods.simpleTokenPrime().encodeABI();
  const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, ['address']);
  return Promise.resolve(responseHelper.successWithData({simpleTokenPrimeContractAddress: response[0]}));
}

OpenStUtilityContractInteract.prototype.getSimpleTokenPrimeUUID = async function() {
  const encodedABI = currContract.methods.uuidSTPrime().encodeABI();
  const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI);
  return Promise.resolve(responseHelper.successWithData({simpleTokenPrimeUUID: response}));
}

OpenStUtilityContractInteract.prototype.processMinting = async function(reserveAddress,
                                                                        reservePassphrase, stakingIntentHash){

  const encodedABI = currContract.methods.processMinting(stakingIntentHash).encodeABI();

  const transactionReceipt = await helper.safeSendFromAddr(
      web3RpcProvider,
      currContractAddr,
      encodedABI,
      reserveAddress,
      reservePassphrase,
      { gasPrice: UC_GAS_PRICE }
  );

  //return => tokenAddress;
  return Promise.resolve(transactionReceipt);

}

OpenStUtilityContractInteract.prototype.getSymbol = async function(){
  const transactionObject = currContract.methods.STPRIME_SYMBOL();
  const encodedABI = transactionObject.encodeABI();
  const transactionOutputs = helper.getTransactionOutputs( transactionObject );
  const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
  return Promise.resolve(responseHelper.successWithData({symbol: response[0]}));
}

OpenStUtilityContractInteract.prototype.getName = async function(){
  const transactionObject = currContract.methods.STPRIME_NAME();
  const encodedABI = transactionObject.encodeABI();
  const transactionOutputs = helper.getTransactionOutputs( transactionObject );
  const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
  return Promise.resolve(responseHelper.successWithData({name: response[0]}));
}

OpenStUtilityContractInteract.prototype.getConversationRate = async function(){
  const transactionObject = currContract.methods.STPRIME_CONVERSION_RATE();
  const encodedABI = transactionObject.encodeABI();
  const transactionOutputs = helper.getTransactionOutputs( transactionObject );
  const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
  return Promise.resolve(responseHelper.successWithData({conversion_rate: response[0]}));
}

OpenStUtilityContractInteract.prototype.proposeBrandedToken = async function(senderAddress,
                                                     senderPassphrase, symbol, name, conversionRate) {

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
}

OpenStUtilityContractInteract.prototype.registerBrandedToken = async function(senderAddress,
                  senderPassphrase, symbol, name, conversionRate, requester, brandedToken, checkUuid){

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

};