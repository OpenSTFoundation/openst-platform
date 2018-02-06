"use strict";

/**
 *
 * Contract interaction methods for Simple Token Contract.<br><br>
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
  , OpsManagedKlass = require(rootPrefix + '/lib/contract_interact/ops_managed')
;

const simpleTokenContractName = 'simpleToken'
  , simpleTokenContractAddr = coreAddresses.getAddressForContract(simpleTokenContractName)
  , simpleTokenContractAbi = coreAddresses.getAbiForContract(simpleTokenContractName)
  , simpleTokenContractObj = new web3RpcProvider.eth.Contract(simpleTokenContractAbi)
  , VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE
;

/**
 * Constructor for SimpleToken Contract Interact
 *
 * @constructor
 * @augments OpsManagedKlass
 */
const SimpleTokenKlass = function() {
  this.contractAddress = simpleTokenContractAddr;
  simpleTokenContractObj.options.address = this.contractAddress;
  simpleTokenContractObj.setProvider(web3RpcProvider.currentProvider);

  OpsManagedKlass.call(this, this.contractAddress, web3RpcProvider, simpleTokenContractObj, VC_GAS_PRICE);
};

// adding the methods from OpsManged Contract
SimpleTokenKlass.prototype = Object.create(OpsManagedKlass.prototype);

SimpleTokenKlass.prototype.constructor = SimpleTokenKlass;

/**
 * Get ST balance of an address
 *
 * @param {string} address - address of which ST balance is to be fetched
 *
 * @return {promise<result>}
 *
 */
SimpleTokenKlass.prototype.balanceOf = async function (address) {
  const oThis = this
    , callMethodResult = await oThis._callMethod('balanceOf');
  return Promise.resolve(responseHelper.successWithData(
    {balance: callMethodResult.data.balanceOf}));
};

/**
 * Method by which we can find how much of autorized value by ownerAddress is unspent by spenderAddress
 *
 * @param {string} ownerAddress - address which authorized spenderAddress to spend value
 * @param {string} spenderAddress - address which was authorized to spend value
 *
 * @return {promise<result>}
 *
 */
SimpleTokenKlass.prototype.allowance = async function (ownerAddress, spenderAddress) {
  const oThis = this
    , callMethodResult = await oThis._callMethod('allowance', [ownerAddress, spenderAddress]);
  return Promise.resolve(responseHelper.successWithData(
    {remaining: callMethodResult.data.allowance}));
};

/**
 * Approve spender on behalf of sender to spend amount equal to value ST.
 *
 * @param {string} senderAddress - address which authorizes spenderAddress to spend value
 * @param {string} senderPassphrase - passphrase of sender address
 * @param {string} spenderAddress - address which is authorized to spend value
 * @param {number} value - value
 * @param {boolean} inAsync - true of one wants only the transaction hash and not wait till the mining
 *
 * @return {promise}
 *
 */
SimpleTokenKlass.prototype.approve = async function (senderAddress, senderPassphrase, spenderAddress, value, inAsync) {
  const encodedABI = simpleTokenContractObj.methods.approve(spenderAddress, value).encodeABI();

  if (inAsync) {
    return contractInteractHelper.sendTxAsyncFromAddr(
      web3RpcProvider,
      simpleTokenContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {gasPrice: coreConstants.OST_VALUE_GAS_PRICE}
    )
  } else {
    const transactionReceipt = await contractInteractHelper.safeSendFromAddr(
      web3RpcProvider,
      simpleTokenContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {gasPrice: VC_GAS_PRICE}
    );
    return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));
  }
};

/**
 * Finalize
 *
 * @param {string} senderAddress - address which authorizes finalize
 * @param {string} senderPassphrase - passphrase of sender address
 *
 * @return {promise<result>}
 *
 */
SimpleTokenKlass.prototype.finalize = async function (senderAddress, senderPassphrase) {
  const encodedABI = simpleTokenContractObj.methods.finalize().encodeABI();

  const transactionReceipt = await contractInteractHelper.safeSendFromAddr(
    web3RpcProvider,
    simpleTokenContractAddr,
    encodedABI,
    senderAddress,
    senderPassphrase,
    {gasPrice: VC_GAS_PRICE}
  );
  return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));
};

/**
 * Call methods of the contract which don't change the state
 *
 * @param {string} methodName - Contract method name
 * @param {array} args - method arguments
 *
 * @return {promise<result>}
 * @ignore
 *
 */
SimpleTokenKlass.prototype._callMethod = function(methodName, args) {

  const oThis = this
    , scope = simpleTokenContractObj.methods
    , transactionObject = scope[methodName].apply(scope, (args || []))
    , encodeABI = transactionObject.encodeABI()
    , transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject)
    , resultData = {};

  return contractInteractHelper.call(web3RpcProvider, oThis.contractAddress, encodeABI, {}, transactionOutputs)
    .then(function (decodedResponse) {
      return decodedResponse[0];
    })
    .then(function (response) {
      resultData[methodName] = response;
      return responseHelper.successWithData(resultData);
    })
    .catch(function (err) {
      logger.error(err);
      return responseHelper.error('l_ci_st_callMethod_' + methodName + '_1', 'Something went wrong');
    })
};

/**
 * Transfer ost from sender address to receiver address
 *
 * @param {string} senderAddress - address which sends OST
 * @param {string} senderPassphrase - passphrase of sender address
 * @param {string} receiverAddress - address which would recieve OST
 * @param {number} value - OST to transfer
 *
 * @return {promise}
 *
 */
SimpleTokenKlass.prototype.transfer = async function (senderAddress, senderPassphrase, receiverAddress, value, inAsync) {
  const encodedABI = simpleTokenContractObj.methods.transfer(receiverAddress, value).encodeABI();

  if (inAsync) {
    return contractInteractHelper.sendTxAsyncFromAddr(
      web3RpcProvider,
      simpleTokenContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {gasPrice: coreConstants.OST_VALUE_GAS_PRICE}
    )
  } else {
    const transactionReceipt = await contractInteractHelper.safeSendFromAddr(
      web3RpcProvider,
      simpleTokenContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {gasPrice: VC_GAS_PRICE}
    );
    return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));
  }
};


module.exports = new SimpleTokenKlass();