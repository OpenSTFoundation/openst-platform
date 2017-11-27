"use strict";

const rootPrefix = '../..'
  , web3RpcProvider = require('../web3/providers/value_rpc')
  , helper = require('./helper')
  , contractName = 'openSTValue'
  , coreConstants = require(rootPrefix+'/config/core_constants')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currentContractAddr = coreAddresses.getAddressForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract( contractAbi )
  , responseHelper = require(rootPrefix+'/lib/formatter/response')
  , registrarAddress = coreAddresses.getAddressForUser('registrar')
  , registrarKey = coreAddresses.getPassphraseForUser('registrar')
  ;

//currContract.setProvider( web3RpcProvider.currentProvider );

const OpenSTValue = module.exports = function (contractAddress) {
  this.contractAddress = contractAddress;
};

OpenSTValue.prototype = {

  initiateOwnerShipTransfer: async function(senderName, proposedOwner){

    const encodedABI = currContract.methods.initiateOwnershipTransfer(proposedOwner).encodeABI();

    const transactionResponse = await helper.safeSend(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderName,
      { gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
    );

    return Promise.resolve(transactionResponse);

  },

  stake: async function(senderName, uuid, amountST, beneficiaryAddr){

    const encodedABI = currContract.methods.stake(uuid, amountST, beneficiaryAddr).encodeABI();

    const transactionReceiptResult = await helper.safeSend(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderName,
      { gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
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
      { gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
    );

    //return => tokenAddress;
    return Promise.resolve(transactionReceiptResult);

  }

};

