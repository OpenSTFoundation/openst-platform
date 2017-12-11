"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on OpsManaged Contract.<br><br>
 *
 * @module lib/contract_interact/ops_managed_contract
 *
 */

const rootPrefix = '../..'
  , helper = require('./helper')
  , coreConstants = require(rootPrefix+'/config/core_constants')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , responseHelper = require(rootPrefix+'/lib/formatter/response')
  , OwnedContract = require('./owned_contract')
;

/**
 * @constructor
 * @augments OwnedContract
 *
 * @param {String} contractAddress - address where Contract has been deployed
 * @param {String} web3RpcProvider - webRpc provider of network where currContract has been deployed
 * @param {String} currContract - Contract Instance
 * @param {String} defaultGasPrice - default Gas Price
 *
 */
const OpsManagedContract = module.exports = function (contractAddress, web3RpcProvider, currContract, defaultGasPrice) {
  this.contractAddress = contractAddress;
  this.web3RpcProvider = web3RpcProvider;
  this.currContract = currContract;
  this.defaultGasPrice = defaultGasPrice;
  this.currContract.options.address = contractAddress;
  this.currContract.setProvider( web3RpcProvider.currentProvider );
  OwnedContract.call(this, contractAddress, web3RpcProvider, currContract, defaultGasPrice);
};

OpsManagedContract.prototype = Object.create(OwnedContract.prototype);

OpsManagedContract.prototype.constructor = OpsManagedContract;

/**
 * Get currContract's Ops Address
 *
 * @return {Result}
 *
 */
OpsManagedContract.prototype.getOpsAddress = async function() {
  const transactionObject = this.currContract.methods.opsAddress();
  const encodedABI = transactionObject.encodeABI();
  const transactionOutputs = helper.getTransactionOutputs( transactionObject );
  const response = await helper.call(this.web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
  return Promise.resolve(responseHelper.successWithData({address: response[0]}));
};

/**
 * Set currContract's Ops Address
 *
 * @param {String} defaultGasPrice - default Gas Price
 * @param {String} opsAddress - address which is to be made Ops Address of currContract
 * @param {Object} customOptions - custom params for this transaction
 *
 * @return {Promise}
 *
 */
OpsManagedContract.prototype.setOpsAddress = async function(senderName, opsAddress, customOptions) {

  const encodedABI = this.currContract.methods.setOpsAddress(opsAddress).encodeABI();

  var options = { gasPrice: this.defaultGasPrice };

  Object.assign(options,customOptions);

  const transactionReceipt = await helper.safeSend(
    this.web3RpcProvider,
    this.contractAddress,
    encodedABI,
    senderName,
    options
  );

  return Promise.resolve(transactionReceipt);
};

