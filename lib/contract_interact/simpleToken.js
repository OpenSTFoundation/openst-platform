"use strict";

const web3RpcProvider = require('../web3/providers/value_rpc')
  , helper = require('./helper')
  , contractName = 'simpleToken'
  , coreAddresses = require('../../config/core_addresses')
  , currContractAddr = coreAddresses.getAddressForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract(coreAddresses.getAbiForContract(contractName))
  , responseHelper = require('../../lib/formatter/response');

const simpleTokenContractInteract = {

  getAdminAddress: function () {

    const encodeABI = currContract.methods.adminAddress().encodeABI();

    return helper.call(web3RpcProvider, currContractAddr, encodeABI)
      .catch(function (err) {
          console.error(err);
          return Promise.resolve(responseHelper.error('ci_st_1', 'Something went wrong'));
        })
        .then(function (response) {
          return Promise.resolve(responseHelper.successWithData({address: helper.toAddress(web3RpcProvider, response)}));
        });

  },

  balanceOf: function (addr) {

    const encodeABI = currContract.methods.balanceOf(addr).encodeABI();

    return helper.call(web3RpcProvider, currContractAddr, encodeABI)
      .then(function (response) {
        return Promise.resolve(responseHelper.successWithData({balance: helper.decodeUint256(web3RpcProvider, response)}));
      });

  },

  allowance: function(ownerAddress, spenderAddress){
    const encodeABI = currContract.methods.allowance(ownerAddress, spenderAddress).encodeABI();

    return helper.call(web3RpcProvider, currContractAddr, encodeABI)
      .then(function (response) {
        return Promise.resolve(responseHelper.successWithData({remaining: helper.decodeUint256(web3RpcProvider, response)}));
      });
  },

  approve: async function(ownerAddress, ownerPassphrase, spenderAddress, value){

    const encodeABI = currContract.methods.approve(spenderAddress, value).encodeABI();

    const transactionReceipt = await helper.safeSendFromAddr(
      web3RpcProvider,
      currContractAddr,
      encodedABI,
      ownerAddress,
      ownerPassphrase,
      { gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
    );
    return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));
  }

};

// TODO: Receipt shoulf be decoded. thus need abidecoder.
module.exports = simpleTokenContractInteract;