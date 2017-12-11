"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on OpenSTValue Contract.<br><br>
 *
 *   Prerequisite:
 *    <ol>
 *       <li>OpenSTValue Contract Has been Deployed on Value Chain Succesfully</li>
 *     </ol>
 *
 * @module lib/contract_interact/openst_value
 *
 */

const rootPrefix = '../..'
  , web3RpcProvider = require('../web3/providers/value_rpc')
  , helper = require('./helper')
  , contractName = 'openSTValue'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContractAddr = coreAddresses.getAddressForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract(contractAbi)
  , OpsMangedContract = require("./ops_managed_contract")
  , VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE
  , VC_GAS_LIMIT = coreConstants.OST_VALUE_GAS_LIMIT
;

/**
 * @constructor
 * @augments OpsManagedContract
 *
 * @param {String} contractAddress - address on Value Chain where Contract has been deployed
 */
const OpenSTValue = module.exports = function (contractAddress) {
  this.contractAddress = contractAddress;

  OpsMangedContract.call(this, contractAddress, web3RpcProvider, currContract, VC_GAS_PRICE);

  currContract.options.address = contractAddress;
  currContract.setProvider(web3RpcProvider.currentProvider);

};

OpenSTValue.prototype = Object.create(OpsMangedContract.prototype);

OpenSTValue.prototype.constructor = OpenSTValue;

/**
 * Stake ST
 *
 * @param {String} reserveAddress - address who is staking ST
 * @param {String} reservePassphrase - passphrase of reserveAddress
 * @param {String} uuid - UUID of staker
 * @param {String} amountST - anount of ST being staked
 * @param {String} beneficiaryAddr - address to which BT's would be credited
 *
 * @return {Result}
 *
 */
OpenSTValue.prototype.stake = async function (reserveAddress, reservePassphrase, uuid, amountST, beneficiaryAddr) {

  const encodedABI = currContract.methods.stake(uuid, amountST, beneficiaryAddr).encodeABI();

  const transactionReceiptResult = await helper.safeSendFromAddr(
    web3RpcProvider,
    currContractAddr,
    encodedABI,
    reserveAddress,
    reservePassphrase,
    {gasPrice: VC_GAS_PRICE, gas: VC_GAS_LIMIT} // TODO - move gas to a constant for methods which take more than usual gas.
  );

  //return => amountUT, nonce, unlockHeight, stakingIntentHash
  return Promise.resolve(transactionReceiptResult);

};


/**
 * Process Staking ST
 *
 * @param {String} reserveAddress - address who is staking ST
 * @param {String} reservePassphrase - passphrase of reserveAddress
 * @param {String} stakingIntentHash - intent hash which was returned in event data of Stake method
 *
 * @return {Result}
 *
 */
OpenSTValue.prototype.processStaking = async function (reserveAddress, reservePassphrase, stakingIntentHash) {

  const encodedABI = currContract.methods.processStaking(stakingIntentHash).encodeABI();

  const transactionReceiptResult = await helper.safeSendFromAddr(
    web3RpcProvider,
    currContractAddr,
    encodedABI,
    reserveAddress,
    reservePassphrase,
    {gasPrice: VC_GAS_PRICE, gas: VC_GAS_LIMIT}
  );

  console.log('process staking -------------------------------------------------------');
  console.log(JSON.stringify(transactionReceiptResult));
  console.log('-------------------------------------------------------');

  //return => tokenAddress;
  return Promise.resolve(transactionReceiptResult);

};

/**
 * Register Utility Token
 *
 * @param {String} symbol - symbol of token which is being proposed
 * @param {String} name - name of token which is being proposed
 * @param {String} conversionRate - conversation rate of token which is being proposed with respet to Simple Token
 * @param {Number} chainId - chain id of Utility Chain where this token's transactions go
 * @param {String} checkUuid - UUID to validate token config
 * @param {String} senderName - name of sender who signs these transactions
 *
 * @return {Result}
 *
 */
OpenSTValue.prototype.registerUtilityToken = async function (symbol, name, conversionRate, chainId, reserveAddr,
                                                             checkUuid, senderName) {
  console.log("Sender ===> " + senderName);
  const encodedABI = currContract.methods.registerUtilityToken(symbol, name, conversionRate, chainId, reserveAddr, checkUuid).encodeABI();
  const transactionReceipt = await helper.safeSend(
    web3RpcProvider,
    currContractAddr,
    encodedABI,
    senderName,
    {gasPrice: VC_GAS_PRICE}
  );

  console.log('----------------------------------------------------------------------');
  console.log(JSON.stringify(transactionReceipt));
  console.log('----------------------------------------------------------------------');

  return Promise.resolve(transactionReceipt);
};

/**
 * Get Register's address of this Contract
 *
 * @return {String}
 *
 */
OpenSTValue.prototype.getRegistrar = function () {
  return currContract.methods.registrar().call()
    .then(_out => {
      console.log("getRegistrar :: _out", _out);
      return Promise.resolve(_out);
    })
    ;
};

/**
 * Get hashed UUID on the basis of passed params
 *
 * @param {String} sym - symbol of token which is being proposed
 * @param {String} name - name of token which is being proposed
 * @param {Number} chainIdValue - chain id of Value Chain where this token's transactions go
 * @param {Number} chainIdUtility - chain id of Utility Chain where this token's transactions go
 * @param {String} conversionRate - conversation rate of token which is being proposed with respet to Simple Token
 * @param {String} contractAddress - address where this Symbol's contract is deployed
 *
 * @return {String}
 *
 */
OpenSTValue.prototype.getHashUUID = function (sym, name, chainIdValue, chainIdUtility, contractAddress, convertionRate) {
  return currContract.methods.hashUuid(sym, name, chainIdValue, chainIdUtility, contractAddress, convertionRate).call()
    .then(function (_out) {
      console.log("getHashUUID :: _out", _out);
      return Promise.resolve(_out);
    })
    ;
};

/**
 * Get next nonce for an addr
 *
 * @param {Address} address - this is the address for which the next nocne is to be queried
 *
 * @return {Promise}
 */
OpenSTValue.prototype.getNextNonce = function (address) {
  return currContract.methods.getNextNonce(address).call()
    .then(function (_out) {
      return Promise.resolve(_out);
    })
    ;
};
/**
 * Process Unstaking ST
 *
 * @param {String} redeemerAddress - address of redeemer
 * @param {String} redeemerPassphrase - passphrase of redeemer
 * @param {String} redeemptionIntentHash - intent hash which was returned in event data of Stake method
 *
 * @return {Result}
 *
 */
OpenSTValue.prototype.processUnstaking = async function (redeemerAddress, redeemerPassphrase, redeemptionIntentHash) {

  const encodedABI = currContract.methods.processUnstaking(redeemptionIntentHash).encodeABI();

  const transactionReceiptResult = await helper.safeSendFromAddr(
    web3RpcProvider,
    currContractAddr,
    encodedABI,
    redeemerAddress,
    redeemerPassphrase,
    {gasPrice: VC_GAS_PRICE, gas: VC_GAS_LIMIT}
  );

  console.log('process staking -------------------------------------------------------');
  console.log(JSON.stringify(transactionReceiptResult));
  console.log('-------------------------------------------------------');

  //return => tokenAddress;
  return Promise.resolve(transactionReceiptResult);

};

