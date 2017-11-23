"use strict";

const web3RpcProvider = require('../web3/providers/value_rpc')
  , rootPrefix = '../..'
  , contractName = 'staking'
  , contractHelper = require('./helper')
  , coreConstants = require(rootPrefix+'/config/core_constants')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , currContractAddr = coreConstants.OST_STAKING_CONTRACT_ADDR
  , currContract = new web3RpcProvider.eth.Contract(coreAddresses.getAbiForContract(contractName))
  , responseHelper = require('../../lib/formatter/response')
  , Assert = require('assert');

const stakingContractInteract = {

  registerUtilityToken: async function(symbol, name, decimals, conversionRate, chainId, reserveAddr, senderName){
    console.log("Sender ===> "+ senderName);
    const senderAddr = coreAddresses.getAddressForUser(senderName);
    const encodedABI = currContract.methods.registerUtilityToken(symbol, name, decimals, conversionRate, chainId, reserveAddr).encodeABI();
    const transactionReceipt = await contractHelper.safeSend(
      web3RpcProvider,
      currContractAddr,
      encodedABI,
      senderName,
      { gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
    );
    return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));
  }
};

module.exports = stakingContractInteract;