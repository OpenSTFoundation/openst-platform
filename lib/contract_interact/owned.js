"use strict";

/**
 *
 * Contract interaction methods for Owned Contract.<br><br>
 *
 * @module lib/contract_interact/owned
 *
 */

const rootPrefix = '../..'
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * Constructor for Owned Contract
 *
 * @constructor
 *
 * @param {string} contractAddress - address where Contract has been deployed
 * @param {string} web3RpcProvider - webRpc provider of network where currContract has been deployed
 * @param {string} currContract - Contract Instance
 * @param {string} defaultGasPrice - default Gas Price
 *
 */
const OwnedKlass = function (contractAddress, web3RpcProvider, currContract, defaultGasPrice) {
  this.contractAddress = contractAddress;
  this.web3RpcProvider = web3RpcProvider;
  this.currContract = currContract;
  this.defaultGasPrice = defaultGasPrice;
  this.currContract.options.address = contractAddress;
  this.currContract.setProvider(web3RpcProvider.currentProvider);
};

OwnedKlass.prototype = {

  /**
   * Initiate Ownership of currContract
   *
   * @param {string} senderName - Sender of this Transaction
   * @param {string} proposedOwner - address to which ownership needs to be transferred
   * @param {object} customOptions - custom params of this transaction
   *
   * @return {promise<result>}
   *
   */
  initiateOwnerShipTransfer: async function (senderName, proposedOwner, customOptions) {
    const encodedABI = this.currContract.methods.initiateOwnershipTransfer(proposedOwner).encodeABI();

    var options = {gasPrice: this.defaultGasPrice};

    Object.assign(options, customOptions);

    return contractInteractHelper.safeSend(
      this.web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderName,
      options
    );
  },

  /**
   * Get address of Owner of currContract
   *
   * @return {promise<result>}
   *
   */
  getOwner: async function () {
    const transactionObject = this.currContract.methods.proposedOwner();
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject);
    const response = await contractInteractHelper.call(this.web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(responseHelper.successWithData({address: response[0]}));
  }
};

module.exports = OwnedKlass;