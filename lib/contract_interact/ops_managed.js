"use strict";

/**
 *
 * Contract interaction methods for Ops Managed Contract.<br><br>
 *
 * @module lib/contract_interact/ops_managed
 *
 */

const rootPrefix = '../..'
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , OwnedKlass = require(rootPrefix + '/lib/contract_interact/owned')
;

/**
 * Constructor for Ops Managed Contract
 *
 * @constructor
 * @augments OwnedKlass
 *
 * @param {string} contractAddress - address where Contract has been deployed
 * @param {string} web3RpcProvider - webRpc provider of network where currContract has been deployed
 * @param {string} currContract - Contract Instance
 * @param {string} defaultGasPrice - default Gas Price
 *
 */
const OpsManagedKlass = function (contractAddress, web3RpcProvider, currContract, defaultGasPrice) {
  this.contractAddress = contractAddress;
  this.web3RpcProvider = web3RpcProvider;
  this.currContract = currContract;
  this.defaultGasPrice = defaultGasPrice;
  this.currContract.options.address = contractAddress;
  this.currContract.setProvider(web3RpcProvider.currentProvider);
  OwnedKlass.call(this, contractAddress, web3RpcProvider, currContract, defaultGasPrice);
};

OpsManagedKlass.prototype = Object.create(OwnedKlass.prototype);

OpsManagedKlass.prototype.constructor = OpsManagedKlass;

/**
 * Get currContract's Ops Address
 *
 * @return {promise<result>}
 *
 */
OpsManagedKlass.prototype.getOpsAddress = async function () {
  const transactionObject = this.currContract.methods.opsAddress();
  const encodedABI = transactionObject.encodeABI();
  const transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject);
  const response = await contractInteractHelper.call(this.web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
  return Promise.resolve(responseHelper.successWithData({address: response[0]}));
};

/**
 * Set currContract's Ops Address
 *
 * @param {string} senderName - sender name
 * @param {string} opsAddress - address which is to be made Ops Address of currContract
 * @param {object} customOptions - custom params for this transaction
 *
 * @return {promise<result>}
 *
 */
OpsManagedKlass.prototype.setOpsAddress = async function (senderName, opsAddress, customOptions) {

  const encodedABI = this.currContract.methods.setOpsAddress(opsAddress).encodeABI();

  var options = {gasPrice: this.defaultGasPrice};

  Object.assign(options, customOptions);

  const transactionReceipt = await contractInteractHelper.safeSend(
    this.web3RpcProvider,
    this.contractAddress,
    encodedABI,
    senderName,
    options
  );

  return Promise.resolve(transactionReceipt);
};


module.exports = OpsManagedKlass;
