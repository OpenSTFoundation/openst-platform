"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on OpenSTUtility Contract.<br><br>
 *
 *   Prerequisite:
 *    <ol>
 *       <li>OpenSTUtility Contract Has been Deployed on Utility Chain Succesfully</li>
 *     </ol>
 *
 * @module lib/contract_interact/openst_utility
 *
 */

const rootPrefix = '../..'
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , contractName = 'openSTUtility'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContractAddr = coreAddresses.getAddressForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract(contractAbi)
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , OwnedContract = require("./owned_contract")
  , UC_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE
  , UC_GAS_LIMIT = coreConstants.OST_UTILITY_GAS_LIMIT
;

/**
 * @constructor
 * @augments OwnedContract
 *
 * @param {String} contractAddress - address on Utility Chain where Contract has been deployed
 */
const OpenStUtilityContractInteract = module.exports = function (contractAddress) {

  contractAddress = contractAddress || currContractAddr;

  this.contractAddress = contractAddress;

  console.log("OpenStUtilityContractInteract :: contractAddress", contractAddress);

  currContract.options.address = contractAddress;
  currContract.setProvider(web3RpcProvider.currentProvider);

  OwnedContract.call(this, contractAddress, web3RpcProvider, currContract, UC_GAS_PRICE)

};

OpenStUtilityContractInteract.prototype = Object.create(OwnedContract.prototype);

OpenStUtilityContractInteract.prototype.constructor = OpenStUtilityContractInteract;

/**
 * Fetch Address on Utility Chain where STPrime Contract has been deployed
 *
 * @return {Result}
 *
 */
OpenStUtilityContractInteract.prototype.getSimpleTokenPrimeContractAddress = async function () {
  const encodedABI = currContract.methods.simpleTokenPrime().encodeABI();
  const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, ['address']);
  return Promise.resolve(responseHelper.successWithData({simpleTokenPrimeContractAddress: response[0]}));
};

/**
 * Fetch UUID of STPrime Contract
 *
 * @return {Result}
 *
 */
OpenStUtilityContractInteract.prototype.getSimpleTokenPrimeUUID = async function () {
  const encodedABI = currContract.methods.uuidSTPrime().encodeABI();
  const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI);
  return Promise.resolve(responseHelper.successWithData({simpleTokenPrimeUUID: response}));
};

/**
 * Process Minting
 *
 * @param {String} reserveAddress - reserve's address which is minting
 * @param {String} reservePassphrase - passphrase of reserveAddress
 * @param {String} stakingIntentHash -
 *
 * @return {Result}
 *
 */
OpenStUtilityContractInteract.prototype.processMinting = async function (reserveAddress,
                                                                         reservePassphrase, stakingIntentHash) {

  const encodedABI = currContract.methods.processMinting(stakingIntentHash).encodeABI();

  const transactionReceipt = await helper.safeSendFromAddr(
    web3RpcProvider,
    currContractAddr,
    encodedABI,
    reserveAddress,
    reservePassphrase,
    {gasPrice: UC_GAS_PRICE, gas: 1000000}
  );

  console.log('process minting -------------------------------------------------------');
  console.log(JSON.stringify(transactionReceipt));
  console.log('-------------------------------------------------------');

  //return => tokenAddress;
  return Promise.resolve(transactionReceipt);

};

/**
 * Get Symbol of STPrime
 *
 * @return {Result}
 *
 */
OpenStUtilityContractInteract.prototype.getSymbol = async function () {
  const transactionObject = currContract.methods.STPRIME_SYMBOL();
  const encodedABI = transactionObject.encodeABI();
  const transactionOutputs = helper.getTransactionOutputs(transactionObject);
  const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
  return Promise.resolve(responseHelper.successWithData({symbol: response[0]}));
};

/**
 * Get Name of STPrime
 *
 * @return {Result}
 *
 */
OpenStUtilityContractInteract.prototype.getName = async function () {
  const transactionObject = currContract.methods.STPRIME_NAME();
  const encodedABI = transactionObject.encodeABI();
  const transactionOutputs = helper.getTransactionOutputs(transactionObject);
  const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
  return Promise.resolve(responseHelper.successWithData({name: response[0]}));
};

/**
 * Get Conversion Rate of STPrime
 *
 * @return {Result}
 *
 */
OpenStUtilityContractInteract.prototype.getConversationRate = async function () {
  const transactionObject = currContract.methods.STPRIME_CONVERSION_RATE();
  const encodedABI = transactionObject.encodeABI();
  const transactionOutputs = helper.getTransactionOutputs(transactionObject);
  const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
  return Promise.resolve(responseHelper.successWithData({conversion_rate: response[0]}));
};

/**
 * Propose Branded Token
 *
 * @param {String} senderAddress - sender's address which is proposing BT
 * @param {String} senderPassphrase - passphrase of senderPassphrase
 * @param {String} symbol - symbol of Token which is being Proposed
 * @param {String} name - name of Token which is being Proposed
 * @param {String} conversionRate - conversion rate with respect to ST of Token which is being Proposed
 *
 * @return {Result}
 *
 */
OpenStUtilityContractInteract.prototype.proposeBrandedToken = async function (senderAddress,
                                                                              senderPassphrase, symbol, name, conversionRate) {

  //Calculate gas required for proposing branded token.
  const gasToUse = await currContract.methods.proposeBrandedToken(symbol, name, conversionRate).estimateGas({
    from: senderAddress,
    gasPrice: UC_GAS_PRICE
  });

  const encodedABI = currContract.methods.proposeBrandedToken(symbol, name, conversionRate).encodeABI();
  console.log("proposeBrandedToken :: \n\tgasToUse", gasToUse,
    "\n\tsymbol", symbol,
    "\n\tname", name,
    "\n\tconversionRate", conversionRate
  );

  if (Number(gasToUse) === Number(UC_GAS_LIMIT)) {
    return Promise.resolve(responseHelper.error('ci_ou_1', 'Something went wrong'));
  }

  return helper.safeSendFromAddr(
    web3RpcProvider,
    currContractAddr,
    encodedABI,
    senderAddress,
    senderPassphrase,
    {
      gasPrice: UC_GAS_PRICE,
      gas: gasToUse
    }
  );
};

/**
 * redeem
 *
 * @param {String} uuid - uuid of the branded token
 * @param {Number} amountBT - amount of Branded token
 * @param {Number} nonce - nonce to be used
 *
 * @return {Result}
 *
 */
OpenStUtilityContractInteract.prototype.redeem = async function (senderAddress,
                                                                 senderPassphrase,
                                                                 uuid,
                                                                 amountBT,
                                                                 nonce) {
  //Calculate gas required
  const gasToUse = await currContract.methods.redeem(uuid, amountBT, nonce).estimateGas({
    from: senderAddress,
    gasPrice: UC_GAS_PRICE
  });

  const encodedABI = currContract.methods.redeem(uuid, amountBT, nonce).encodeABI();
  console.log("redeem :: \n\tgasToUse", gasToUse,
    "\n\tuuid", uuid,
    "\n\tamountBT", amountBT,
    "\n\tnonce", nonce
  );

  if (Number(gasToUse) === Number(UC_GAS_LIMIT)) {
    return Promise.resolve(responseHelper.error('ci_ou_2', 'Max gas will be used, as per the estimated gas. Check the params.'));
  }

  return helper.safeSendFromAddr(
    web3RpcProvider,
    currContractAddr,
    encodedABI,
    senderAddress,
    senderPassphrase,
    {
      gasPrice: UC_GAS_PRICE,
      gas: gasToUse
    }
  );
};

/**
 * redeem
 *
 * @param {String} redeemerAddress - address of redeemer
 * @param {String} redeemerPassphrase - passphrase of redeemer
 * @param {String} redeemptionIntentHash - intent hash which was returned in event data of Stake method
 *
 * @return {Result}
 *
 */
OpenStUtilityContractInteract.prototype.processRedeeming = async function (redeemerAddress, redeemerPassphrase, redeemptionIntentHash) {

  const encodedABI = currContract.methods.processRedeeming(redeemptionIntentHash).encodeABI();

  const transactionReceiptResult = await helper.safeSendFromAddr(
    web3RpcProvider,
    currContractAddr,
    encodedABI,
    redeemerAddress,
    redeemerPassphrase,
    {gasPrice: UC_GAS_PRICE, gas: UC_GAS_LIMIT}
  );

  console.log('process staking -------------------------------------------------------');
  console.log(JSON.stringify(transactionReceiptResult));
  console.log('-------------------------------------------------------');

  //return => tokenAddress;
  return Promise.resolve(transactionReceiptResult);

};
