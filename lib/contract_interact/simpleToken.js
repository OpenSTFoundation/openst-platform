"use strict";

const rootPrefix = '../..'
  , contractName = 'simpleToken'
  , web3RpcProvider = require(rootPrefix+'/lib/web3/providers/value_rpc')
  , helper = require(rootPrefix+'/lib/contract_interact/helper')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , coreConstants = require(rootPrefix+'/config/core_constants')
  , responseHelper = require(rootPrefix+'/lib/formatter/response')
  , currContractAddr = coreAddresses.getAddressForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract(coreAddresses.getAbiForContract(contractName))
  ;

const simpleTokenContractInteract = {

  getAdminAddress: function () {

    const encodedABI = currContract.methods.adminAddress().encodeABI();

    return helper.call(web3RpcProvider, currContractAddr, encodedABI)
      .catch(function (err) {
          console.error(err);
          return Promise.resolve(responseHelper.error('ci_st_1', 'Something went wrong'));
        })
        .then(function (response) {
          return Promise.resolve(responseHelper.successWithData({address: helper.toAddress(web3RpcProvider, response)}));
        });

  },

  balanceOf: function (addr) {

    const encodedABI = currContract.methods.balanceOf(addr).encodeABI();

    return helper.call(web3RpcProvider, currContractAddr, encodedABI, {}, ['uint256'])
      .then(function (response) {
        return Promise.resolve(responseHelper.successWithData({balance: response[0]}));
      });

  },

  allowance: function(ownerAddress, spenderAddress){
    const encodedABI = currContract.methods.allowance(ownerAddress, spenderAddress).encodeABI();

    return helper.call(web3RpcProvider, currContractAddr, encodedABI, {}, ['uint256'])
      .then(function (response) {
        return Promise.resolve(responseHelper.successWithData({remaining: response[0]}));
      });
  },

  approve: async function(ownerAddress, ownerPassphrase, spenderAddress, value){

    const encodedABI = currContract.methods.approve(spenderAddress, value).encodeABI();

    const transactionReceipt = await helper.safeSendFromAddr(
      web3RpcProvider,
      currContractAddr,
      encodedABI,
      ownerAddress,
      ownerPassphrase,
      { gasPrice: coreConstants.OST_VALUE_GAS_PRICE }
    );
    return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));
  }

};

// TODO: Receipt shoulf be decoded. thus need abidecoder.
module.exports = simpleTokenContractInteract;