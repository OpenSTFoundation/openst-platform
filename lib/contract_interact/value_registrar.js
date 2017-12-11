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
  , OpsMangedContract = require("./ops_managed_contract")
  , VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE
;

currContract.setProvider( web3RpcProvider.currentProvider );

const ValueRegistrar = module.exports = function (contractAddress) {

  this.contractAddress = contractAddress;

  currContract.options.address = contractAddress;
  currContract.setProvider( web3RpcProvider.currentProvider );

  OpsMangedContract.call(this, contractAddress, web3RpcProvider, currContract, VC_GAS_PRICE)

};

ValueRegistrar.prototype = Object.create(OpsMangedContract.prototype);

ValueRegistrar.prototype.constructor = ValueRegistrar;

ValueRegistrar.prototype.addCore = async function(senderName, registry, coreContractAddress) {

  const encodedABI = currContract.methods.addCore(registry, coreContractAddress).encodeABI();

  const transactionReceipt = await helper.safeSend(
    web3RpcProvider,
    this.contractAddress,
    encodedABI,
    senderName,
    { gasPrice: VC_GAS_PRICE }
  );

  return Promise.resolve(transactionReceipt);

};

ValueRegistrar.prototype.registerUtilityToken = async function(senderAddress, senderPassphrase,
                             registry, symbol, name, conversionRate, utilityChainId, requester, checkUuid){

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

    if ( Number( gasToUse ) === Number( VC_GAS_PRICE ) ) {
      return Promise.resolve( responseHelper.error('ci_vr_1', 'Something went wrong') );
    }


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

};


ValueRegistrar.prototype.confirmRedemptionIntent = async function (
  senderAddress,
  senderPassphrase,
  registryContractAddr,
  uuid,
  redeemerAddr,
  redeemerNonce,
  amountUT,
  redemptionUnlockHeight,
  redemptionIntentHash
) {

  const encodedABI = currContract.methods.confirmRedemptionIntent(
    registryContractAddr,
    uuid,
    redeemerAddr,
    redeemerNonce,
    amountUT,
    redemptionUnlockHeight,
    redemptionIntentHash
  ).encodeABI();

  const transactionReceiptResult = await helper.safeSendFromAddr(
    web3RpcProvider,
    this.contractAddress,
    encodedABI,
    senderAddress,
    senderPassphrase,
    {
      gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE,
      gas: VC_GAS_PRICE
    }
  );

  console.log(transactionReceiptResult);

  return Promise.resolve(transactionReceiptResult);

};