"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on SimpleToken Contract.<br><br>
 *
 * @module lib/contract_interact/simple_token
 *
 */

const rootPrefix = '../..'
  , contractName = 'simpleToken'
  , web3RpcProvider = require(rootPrefix+'/lib/web3/providers/value_rpc')
  , helper = require(rootPrefix+'/lib/contract_interact/helper')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , coreConstants = require(rootPrefix+'/config/core_constants')
  , responseHelper = require(rootPrefix+'/lib/formatter/response')
  , currContractAddr = coreAddresses.getAddressForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract(coreAddresses.getAbiForContract(contractName))
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  ;

const simpleTokenContractInteract = {

  /**
   * Get SimpleToken Contract's Admin Address
   *
   * @return {Promise}
   *
   */
  getAdminAddress: function () {

    const encodedABI = currContract.methods.adminAddress().encodeABI();

    return helper.call(web3RpcProvider, currContractAddr, encodedABI)
      .catch(function (err) {
          logger.error(err);
          return Promise.resolve(responseHelper.error('ci_st_1', 'Something went wrong'));
        })
        .then(function (response) {
          return Promise.resolve(responseHelper.successWithData({address: helper.toAddress(web3RpcProvider, response)}));
        });

  },

  /**
   * Get ST balance of an address
   *
   * @param {String} addr - address of which ST balance is to be fetched
   *
   * @return {Promise}
   *
   */
  balanceOf: function (addr) {

    const encodedABI = currContract.methods.balanceOf(addr).encodeABI();

    return helper.call(web3RpcProvider, currContractAddr, encodedABI, {}, ['uint256'])
      .then(function (response) {
        return Promise.resolve(responseHelper.successWithData({balance: response[0]}));
      });

  },

  /**
   * method by which we can find how much of autorized value by ownerAddress is unspent by spenderAddress
   *
   * @param {String} ownerAddress - address which authorized spenderAddress to spend value
   * @param {String} spenderAddress - address which was authorized to spend value
   *
   * @return {Promise}
   *
   */
  allowance: function(ownerAddress, spenderAddress){

    const encodedABI = currContract.methods.allowance(ownerAddress, spenderAddress).encodeABI();

    return helper.call(web3RpcProvider, currContractAddr, encodedABI, {}, ['uint256'])
      .then(function (response) {
        return Promise.resolve(responseHelper.successWithData({remaining: response[0]}));
      });
  },

  /**
   * method by which ownerAddress authorizes spenderAddress to spend value on their behalf.
   *
   * @param {String} ownerAddress - address which authorizes spenderAddress to spend value
   * @param {String} ownerPassphrase - passphrase of ownerAddress
   * @param {String} spenderAddress - address which is authorized to spend value
   * @param {Number} value - value
   *
   * @return {Promise}
   *
   */
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