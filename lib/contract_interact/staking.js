"use strict";

const web3RpcProvider = require('../web3/providers/value_rpc')
  , rootPrefix = '../..'
  , contractName = 'staking'
  , helper = require('./helper')
  , coreConstants = require(rootPrefix+'/config/core_constants')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , currContractAddr = coreConstants.OST_STAKING_CONTRACT_ADDR
  , currContract = new web3RpcProvider.eth.Contract(coreAddresses.getAbiForContract(contractName))
  , responseHelper = require('../../lib/formatter/response')
  , Assert = require('assert');

const stakingContractInteract = {

  registerUtilityToken: function(symbol, name, decimals, conversionRate, chainId, reserveAddr, senderAddr){
    Assert.strictEqual(typeof symbol, 'string', `symbol must be of type 'string'`);
    Assert.strictEqual(typeof name, 'string', `name must be of type 'string'`);
    Assert.strictEqual(typeof decimals, 'number', `decimals must be of type 'number'`);
    Assert.strictEqual(typeof conversionRate, 'number', `conversionRate must be of type 'number'`);
    Assert.strictEqual(typeof chainId, 'string', `chainId must be of type 'string'`);
    Assert.strictEqual(typeof reserveAddr, 'string', `reserveAddr must be of type 'string'`);
    Assert.strictEqual(typeof senderAddr, 'string', `senderAddr must be of type 'string'`);

    const encodeABI = currContract.methods.registerUtilityToken(symbol, name, decimals, conversionRate, chainId, reserveAddr).encodeABI();

    return helper.send(web3RpcProvider, currContractAddr, encodeABI,
      { from: senderAddr, gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE})
      .catch(function (err) {
        console.error(err);
        return Promise.resolve(responseHelper.error('ci_ut_2', 'Something went wrong'));
      })
      .then(function (response) {
        console.log(response);
        return Promise.resolve(responseHelper.successWithData({}));
      });
  }
};

module.exports = stakingContractInteract;