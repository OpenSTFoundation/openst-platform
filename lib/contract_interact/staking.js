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
    Assert.strictEqual(typeof senderName, 'string', `senderName must be of type 'string'`);
    const senderAddr = coreAddresses.getAddressForUser(senderName);
    Assert.strictEqual(typeof symbol, 'string', `symbol must be of type 'string'`);
    Assert.strictEqual(typeof name, 'string', `name must be of type 'string'`);
    Assert.strictEqual(typeof decimals, 'number', `decimals must be of type 'number'`);
    Assert.strictEqual(typeof conversionRate, 'number', `conversionRate must be of type 'number'`);
    Assert.strictEqual(typeof chainId, 'string', `chainId must be of type 'string'`);
    Assert.strictEqual(typeof reserveAddr, 'string', `reserveAddr must be of type 'string'`);
    Assert.strictEqual(typeof senderAddr, 'string', `senderAddr must be of type 'string'`);

    const txObj = currContract.methods.registerUtilityToken(symbol, name, decimals, conversionRate, chainId, reserveAddr);
    const transactionReceipt = await contractHelper.safeSend(
      web3RpcProvider,
      txObj,
      senderName,
      { gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
    );
    return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));
  }
};

module.exports = stakingContractInteract;