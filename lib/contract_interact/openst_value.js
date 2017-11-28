"use strict";

const rootPrefix = '../..'
  , web3RpcProvider = require('../web3/providers/value_rpc')
  , helper = require('./helper')
  , contractName = 'openSTValue'
  , coreConstants = require(rootPrefix+'/config/core_constants')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContractAddr = coreAddresses.getAddressForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract( contractAbi )
  , responseHelper = require(rootPrefix+'/lib/formatter/response')
  , registrarAddress = coreAddresses.getAddressForUser('valueRegistrar')
  , registrarKey = coreAddresses.getPassphraseForUser('valueRegistrar')
  , VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE
  ;

//currContract.setProvider( web3RpcProvider.currentProvider );

const OpenSTValue = module.exports = function (contractAddress) {
  this.contractAddress = contractAddress;

  currContract.options.address = contractAddress;
  currContract.setProvider( web3RpcProvider.currentProvider );

};

OpenSTValue.prototype = {

  initiateOwnerShipTransfer: async function(senderName, proposedOwner, customOptions){

    const encodedABI = currContract.methods.initiateOwnershipTransfer(proposedOwner).encodeABI();

    var options = { gasPrice: VC_GAS_PRICE };

    Object.assign(options,customOptions);

    const transactionResponse = await helper.safeSend(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderName,
      options
    );

    return Promise.resolve(transactionResponse);

  },

  stake: async function(reserveAddress, reservePassphrase, uuid, amountST, beneficiaryAddr){

    const encodedABI = currContract.methods.stake(uuid, amountST, beneficiaryAddr).encodeABI();

    const transactionReceiptResult = await helper.safeSendFromAddr(
      web3RpcProvider,
      currContractAddr,
      encodedABI,
      reserveAddress,
      reservePassphrase,
      { gasPrice: VC_GAS_PRICE }
    );

    //return => amountUT, nonce, unlockHeight, stakingIntentHash
    return Promise.resolve(transactionReceiptResult);

  },

  processStaking: async function(reserveAddress, reservePassphrase, stakingIntentHash){

    const encodedABI = currContract.methods.processStaking(stakingIntentHash).encodeABI();

    const transactionReceiptResult = await helper.safeSendFromAddr(
      web3RpcProvider,
      currContractAddr,
      encodedABI,
      reserveAddress,
      reservePassphrase,
      { gasPrice: VC_GAS_PRICE }
    );

    //return => tokenAddress;
    return Promise.resolve(transactionReceiptResult);

  },

  addCore: async function(senderName, coreContractAddress){

    const encodedABI = currContract.methods.addCore(coreContractAddress).encodeABI();

    const transactionReceipt = await helper.safeSend(
        web3RpcProvider,
        this.contractAddress,
        encodedABI,
        senderName,
        { gasPrice: VC_GAS_PRICE }
    );

    return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));

  },

  registerUtilityToken: async function(symbol, name, conversionRate, chainId, reserveAddr, checkUuid, senderName){
    console.log("Sender ===> "+ senderName);
    const encodedABI = currContract.methods.registerUtilityToken(symbol, name, conversionRate, chainId, reserveAddr, checkUuid).encodeABI();
    const transactionReceipt = await helper.safeSend(
      web3RpcProvider,
      currContractAddr,
      encodedABI,
      senderName,
      { gasPrice: VC_GAS_PRICE }
    );
    return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));
  },

  getRegistrar: function () {
    return currContract.methods.registrar().call()
      .then( _out => {
        console.log("getRegistrar :: _out", _out);
        Promise.resolve( _out );
      })
    ;
  },
  getHashUUID: function (sym, name, chainIdValue, chainIdUtility, contractAddress, convertionRate ) {
    return currContract.methods.hashUuid( sym, name, chainIdValue, chainIdUtility, contractAddress, convertionRate ).call()
      .then( _out => {
        console.log("getRegistrar :: _out", _out);
        Promise.resolve( _out );
      })
    ;
  }


};

