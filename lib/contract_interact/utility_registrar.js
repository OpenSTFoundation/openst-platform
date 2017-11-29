"use strict";

const rootPrefix = "../.."
  , web3RpcProvider = require(rootPrefix+"/lib/web3/providers/utility_rpc")
  , helper = require("./helper")
  , contractName = 'utilityRegistrar'
  , coreConstants = require(rootPrefix+"/config/core_constants")
  , coreAddresses = require(rootPrefix+"/config/core_addresses")
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract( contractAbi )
  , responseHelper = require(rootPrefix+"/lib/formatter/response")
  , OpsMangedContract = require("./ops_managed_contract")
  , UC_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE
  ;

currContract.setProvider( web3RpcProvider.currentProvider );

const UtilityRegistrar = module.exports = function (contractAddress) {
  this.contractAddress = contractAddress;
  OpsMangedContract.call(this, contractAddress, web3RpcProvider, currContract, UC_GAS_PRICE)
  currContract.options.address = contractAddress;
  currContract.setProvider( web3RpcProvider.currentProvider );

}

UtilityRegistrar.prototype = Object.create(OpsMangedContract.prototype);

UtilityRegistrar.prototype.constructor = UtilityRegistrar;

UtilityRegistrar.prototype.registerBrandedToken = async function(senderAddress, senderPassphrase, registry, symbol,
                                                                 name, conversionRate, requester,
                                                                 brandedToken, checkUuid) {
    //Calculate gas required for proposing branded token.
    const gasToUse = await currContract.methods
      .registerBrandedToken(registry, symbol, name, 
        conversionRate,  requester, 
        brandedToken, checkUuid)
          .estimateGas({
            from: senderAddress,
            gasPrice: UC_GAS_PRICE
          });

    console.log( "registerBrandedToken inputs"
      , "gasToUse", gasToUse
      , "registry", registry
      , "symbol", symbol
      , "name", name
      , "conversionRate", conversionRate
      , "requester", requester
      , "brandedToken", brandedToken
      , "checkUuid", checkUuid
    );

    const encodedABI = currContract.methods.registerBrandedToken(registry, symbol, name, conversionRate, requester, brandedToken, checkUuid).encodeABI();
    const transactionReceiptResult = await helper.safeSendFromAddr(
      web3RpcProvider,
      this.contractAddress,
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

