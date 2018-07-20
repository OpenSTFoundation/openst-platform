"use strict";

/**
 *
 * Contract interaction methods for Ops Managed Contract.<br><br>
 *
 * @module lib/contract_interact/ops_managed
 *
 */

 //getOwnedInteractClass

const rootPrefix = '../..'
  , InstanceComposer = require( rootPrefix + "/instance_composer")
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  /**
    Note: OwnedKlass is a special case here. OpsManagedKlass is derived from it.
    Hence, dont worry, you dont need to use oThis.ic().getOwnedInteractClass()
  **/
  , OwnedKlass = require(rootPrefix + '/lib/contract_interact/owned')
;
require(rootPrefix + '/lib/contract_interact/helper');
require(rootPrefix + '/config/core_addresses');

/**
 * Constructor for Ops Managed Contract
 *
 * @constructor
 * @augments OwnedKlass
 *
 * @param {string} contractAddress - address where Contract has been deployed
 * @param {string} web3Provider - web3 provider of network where currContract has been deployed
 * @param {string} currContract - Contract Instance
 * @param {string} defaultGasPrice - default Gas Price
 *
 */
const OpsManagedKlass = function (contractAddress, web3Provider, currContract, defaultGasPrice) {
  this.contractAddress = contractAddress;
  this.web3Provider = web3Provider;
  this.currContract = currContract;
  this.defaultGasPrice = defaultGasPrice;
  this.currContract.options.address = contractAddress;

  OwnedKlass.call(this, contractAddress, web3Provider, currContract, defaultGasPrice);
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

  const oThis = this
    , contractInteractHelper = oThis.ic().getContractInteractHelper()
  ;

  const transactionObject = oThis.currContract.methods.opsAddress();
  const encodedABI = transactionObject.encodeABI();
  const transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject);
  const response = await contractInteractHelper.call(oThis.web3Provider, oThis.contractAddress, encodedABI, {}, transactionOutputs);
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
  const oThis = this
    , contractInteractHelper = oThis.ic().getContractInteractHelper()
    , coreAddresses           = oThis.ic().getCoreAddresses()
  ;

  const encodedABI = oThis.currContract.methods.setOpsAddress(opsAddress).encodeABI();

  const senderAddr = coreAddresses.getAddressForUser(senderName)
  ;

  var options = {gasPrice: oThis.defaultGasPrice, from: senderAddr};
  Object.assign(options, customOptions);

  const gasToUse = await oThis.currContract.methods.setOpsAddress(opsAddress).estimateGas(options);
  options.gas = gasToUse;

  return contractInteractHelper.safeSend(
    oThis.web3Provider,
    oThis.contractAddress,
    encodedABI,
    senderName,
    options
  );
};

/**
 * Get currContract's Admin Address
 *
 * @return {promise<result>}
 *
 */
OpsManagedKlass.prototype.getAdminAddress = async function () {
  const oThis = this
    , contractInteractHelper = oThis.ic().getContractInteractHelper()
  ;
  const transactionObject = oThis.currContract.methods.adminAddress();
  const encodedABI = transactionObject.encodeABI();
  const transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject);
  const response = await contractInteractHelper.call(oThis.web3Provider, oThis.contractAddress, encodedABI, {}, transactionOutputs);
  return Promise.resolve(responseHelper.successWithData({address: response[0]}));
};

/**
 * Set currContract's Admin Address
 *
 * @param {string} senderName - sender name
 * @param {string} adminAddress - address which is to be made Admin Address of currContract
 * @param {object} customOptions - custom params for this transaction
 *
 * @return {promise<result>}
 *
 */
OpsManagedKlass.prototype.setAdminAddress = async function (senderName, adminAddress, customOptions) {

  const oThis = this
    , contractInteractHelper = oThis.ic().getContractInteractHelper()
    , coreAddresses           = oThis.ic().getCoreAddresses()
  ;

  const encodedABI = oThis.currContract.methods.setAdminAddress(adminAddress).encodeABI();

  const senderAddr = coreAddresses.getAddressForUser(senderName)
  ;

  var options = {gasPrice: oThis.defaultGasPrice, from: senderAddr};
  Object.assign(options, customOptions);

  const gasToUse = await oThis.currContract.methods.setAdminAddress(adminAddress).estimateGas(options);
  options.gas = gasToUse;

  return contractInteractHelper.safeSend(
    oThis.web3Provider,
    oThis.contractAddress,
    encodedABI,
    senderName,
    options
  );
};

InstanceComposer.registerShadowableClass(OpsManagedKlass, "getOpsManagedInteractClass");

module.exports = OpsManagedKlass;
