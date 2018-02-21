"use strict";

/**
 * Contract interaction methods for OpenST Value Contract.<br><br>
 *
 * @module lib/contract_interact/openst_value
 *
 */

const rootPrefix = '../..'
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/value_rpc')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , OpsManagedKlass = require(rootPrefix + '/lib/contract_interact/ops_managed')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

const openSTValueContractName = 'openSTValue'
  , openSTValueContractAbi = coreAddresses.getAbiForContract(openSTValueContractName)
  , openSTValueContractAddr = coreAddresses.getAddressForContract(openSTValueContractName)
  , VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE
  , VC_GAS_LIMIT = coreConstants.OST_VALUE_GAS_LIMIT
  , openSTValueContractObj = new web3RpcProvider.eth.Contract(openSTValueContractAbi)
;

/**
 * OpenST Value Contract constructor
 *
 * @constructor
 * @augments OpsManagedKlass
 *
 * @param {String} contractAddress - address on Value Chain where Contract has been deployed
 */
const OpenSTValueKlass = function (contractAddress) {
  // Helpful while deployement, since ENV variables are not set at that time
  contractAddress = contractAddress || openSTValueContractAddr;

  this.contractAddress = contractAddress;

  openSTValueContractObj.options.address = contractAddress;
  openSTValueContractObj.setProvider(web3RpcProvider.currentProvider);

  OpsManagedKlass.call(this, contractAddress, web3RpcProvider, openSTValueContractObj, VC_GAS_PRICE);
};

// adding the methods from OpsMangedContract
OpenSTValueKlass.prototype = Object.create(OpsManagedKlass.prototype);

OpenSTValueKlass.prototype.constructor = OpenSTValueKlass;

/**
 * Get next nonce for an addr
 *
 * @param {string} address - this is the address for which the next nonce is to be queried
 *
 * @return {Promise}
 */
OpenSTValueKlass.prototype.getNextNonce = async function (address) {
  const oThis = this
    , callMethodResult = await oThis._callMethod('getNextNonce', [address])
    , response = callMethodResult.data.getNextNonce;
  return Promise.resolve(responseHelper.successWithData({nextNounce: response[0]}));
};

/**
 * Get registered token property from the uuid
 *
 * @param {string} uuid - Branded token uuid
 *
 * @return {Promise}
 *
 */
OpenSTValueKlass.prototype.utilityTokens = async function (uuid) {
  const oThis = this
    , callMethodResult = await oThis._callMethod('utilityTokens', [uuid])
    , response = callMethodResult.data.utilityTokens;

  if (response.length != 7) {
    return Promise.resolve(responseHelper.error('l_ci_ov_utilityTokens_1', 'Invalid response length'));
  }else{
    return Promise.resolve(responseHelper.successWithData({
      symbol: response[0],
      name: response[1],
      conversion_rate: response[2],
      conversion_rate_decimals: response[3],
      decimals: response[4],
      chain_id_utility: response[5],
      simple_stake_contract_address: response[6],
      staking_account: response[7]
    }));  
  }  
};

/**
 * Initiate ST Stake
 *
 * @param {string} senderAddr - address of stake initiator
 * @param {string} senderPassphrase - passphrase of stake initiator
 * @param {string} uuid - UUID of BT
 * @param {string} amountSTWeis - anount of ST being staked in Weis
 * @param {string} beneficiaryAddr - address to which BT's would be credited
 * @param {boolean} inAsync - true if one wants only the transaction hash and not wait till the mining
 *
 * @return {promise}
 *
 */
OpenSTValueKlass.prototype.stake = async function (senderAddr, senderPassphrase, uuid, amountSTWeis,
                                                   beneficiaryAddr, inAsync) {

  const encodedABI = openSTValueContractObj.methods.stake(uuid, amountSTWeis, beneficiaryAddr).encodeABI();

  if (inAsync) {
    return contractInteractHelper.sendTxAsyncFromAddr(
      web3RpcProvider,
      openSTValueContractAddr,
      encodedABI,
      senderAddr,
      senderPassphrase,
      {gasPrice: VC_GAS_PRICE, gas: VC_GAS_LIMIT}
    );
  } else {
    const transactionReceiptResult = await contractInteractHelper.safeSendFromAddr(
      web3RpcProvider,
      openSTValueContractAddr,
      encodedABI,
      senderAddr,
      senderPassphrase,
      {gasPrice: VC_GAS_PRICE, gas: VC_GAS_LIMIT}
    );
    return Promise.resolve(transactionReceiptResult);
  }

};

/**
 * Process Staking ST
 *
 * @param {string} senderAddr - address of stake process initiator
 * @param {string} senderPassphrase - passphrase of stake process initiator
 * @param {string} stakingIntentHash - intent hash which was returned in event data of Stake method
 *
 * @return {promise}
 *
 */
OpenSTValueKlass.prototype.processStaking = async function (senderAddr, senderPassphrase, stakingIntentHash) {

  const encodedABI = openSTValueContractObj.methods.processStaking(stakingIntentHash).encodeABI();

  const transactionReceiptResult = await contractInteractHelper.safeSendFromAddr(
    web3RpcProvider,
    openSTValueContractAddr,
    encodedABI,
    senderAddr,
    senderPassphrase,
    {gasPrice: VC_GAS_PRICE, gas: VC_GAS_LIMIT}
  );

  logger.info('process staking -------------------------------------------------------');
  logger.info(JSON.stringify(transactionReceiptResult));
  logger.info('-------------------------------------------------------');

  return Promise.resolve(transactionReceiptResult);

};

/**
 * Process Unstaking ST
 *
 * @param {string} senderAddr - address of unstaking initiator
 * @param {string} senderPassphrase - passphrase of unstaking initiator
 * @param {string} redeemptionIntentHash - intent hash which was returned in event data of Stake method
 *
 * @return {promise}
 *
 */
OpenSTValueKlass.prototype.processUnstaking = async function (senderAddr, senderPassphrase, redeemptionIntentHash) {

  const encodedABI = openSTValueContractObj.methods.processUnstaking(redeemptionIntentHash).encodeABI();

  const transactionReceiptResult = await contractInteractHelper.safeSendFromAddr(
    web3RpcProvider,
    openSTValueContractAddr,
    encodedABI,
    senderAddr,
    senderPassphrase,
    {gasPrice: VC_GAS_PRICE, gas: VC_GAS_LIMIT}
  );

  logger.info('process staking -------------------------------------------------------');
  logger.info(JSON.stringify(transactionReceiptResult));
  logger.info('-------------------------------------------------------');

  return Promise.resolve(transactionReceiptResult);

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
OpenSTValueKlass.prototype._callMethod = function(methodName, args) {

  const oThis = this
    , scope = openSTValueContractObj.methods
    , transactionObject = scope[methodName].apply(scope, (args || []))
    , encodeABI = transactionObject.encodeABI()
    , transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject)
    , resultData = {};

  return contractInteractHelper.call(web3RpcProvider, oThis.contractAddress, encodeABI, {}, transactionOutputs)
    .then(function (decodedResponse) {
      // process response and generate array using numbered keys
      const numberKeys = Array(decodedResponse['__length__']).fill().map((_, i) => i.toString())
        , processedResponse = [];
      for (var key in numberKeys) {
        processedResponse.push(decodedResponse[key]);
      }
      return processedResponse;
    })
    .then(function (response) {
      resultData[methodName] = response;
      return responseHelper.successWithData(resultData);
    })
    .catch(function (err) {
      logger.error(err);
      return responseHelper.error('l_ci_ov_callMethod_'+methodName+'_1', 'Something went wrong');
    })
    ;
};

module.exports = OpenSTValueKlass;