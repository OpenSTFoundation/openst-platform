"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on SimpleToken Contract.<br><br>
 *
 * @module lib/contract_interact/simple_token
 *
 */

const rootPrefix = '../..'
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/value_rpc')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

const simpleTokenContractName = 'simpleToken'
  , simpleTokenContractAddr = coreAddresses.getAddressForContract(simpleTokenContractName)
  , simpleTokenContractObj = new web3RpcProvider.eth.Contract(coreAddresses.getAbiForContract(simpleTokenContractName))
;

/**
 * Constructor for SimpleTokenContractInteractKlass
 *
 * @constructor
 */
const SimpleTokenContractInteractKlass = function() {};

SimpleTokenContractInteractKlass.prototype = {

  /**
   * Get SimpleToken Contract's Admin Address
   *
   * @return {Promise}
   *
   */
  getAdminAddress: function () {

    const encodedABI = simpleTokenContractObj.methods.adminAddress().encodeABI();

    return contractInteractHelper.call(web3RpcProvider, simpleTokenContractAddr, encodedABI)
      .catch(function (err) {
        logger.error(err);
        return Promise.resolve(responseHelper.error('ci_st_1', 'Something went wrong'));
      })
      .then(function (response) {
        return Promise.resolve(responseHelper.successWithData({address: contractInteractHelper.toAddress(web3RpcProvider, response)}));
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

    const encodedABI = simpleTokenContractObj.methods.balanceOf(addr).encodeABI();

    return contractInteractHelper.call(web3RpcProvider, simpleTokenContractAddr, encodedABI, {}, ['uint256'])
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
  allowance: function (ownerAddress, spenderAddress) {

    const encodedABI = simpleTokenContractObj.methods.allowance(ownerAddress, spenderAddress).encodeABI();

    return contractInteractHelper.call(web3RpcProvider, simpleTokenContractAddr, encodedABI, {}, ['uint256'])
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
   * @param {Boolean} inAsync - true of one wants only the transaction hash and not wait till the mining
   *
   * @return {Promise}
   *
   */
  approve: async function (ownerAddress, ownerPassphrase, spenderAddress, value, inAsync) {

    const encodedABI = simpleTokenContractObj.methods.approve(spenderAddress, value).encodeABI();

    if (inAsync) {
      return contractInteractHelper.sendTxAsyncFromAddr(
        web3RpcProvider,
        simpleTokenContractAddr,
        encodedABI,
        ownerAddress,
        ownerPassphrase,
        {gasPrice: coreConstants.OST_VALUE_GAS_PRICE}
      )
    } else {
      const transactionReceipt = await contractInteractHelper.safeSendFromAddr(
        web3RpcProvider,
        simpleTokenContractAddr,
        encodedABI,
        ownerAddress,
        ownerPassphrase,
        {gasPrice: coreConstants.OST_VALUE_GAS_PRICE}
      );
      return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));
    }
  }
};

module.exports = new SimpleTokenContractInteractKlass();