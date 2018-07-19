"use strict";

/**
 * Contract interaction methods for OpenST Value Contract.<br><br>
 *
 * @module lib/contract_interact/openst_value
 *
 */

const rootPrefix = '../..'
  , InstanceComposer = require(rootPrefix + "/instance_composer")
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  /**
   Note: OpsManagedKlass is a special case here. OpsManagedKlass is derived from it.
   Hence, dont worry, you dont need to use oThis.ic().getOwnedInteractClass()
   **/
  , OpsManagedKlass = require(rootPrefix + '/lib/contract_interact/ops_managed')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/lib/contract_interact/helper');
require(rootPrefix + '/services/transaction/estimate_gas');

const openSTValueContractName = 'openSTValue'
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
  const oThis = this
    , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
    , coreAddresses = oThis.ic().getCoreAddresses()
    , coreConstants = oThis.ic().getCoreConstants()

    , web3Provider = web3ProviderFactory.getProvider('value', 'ws')
    , openSTValueContractAbi = coreAddresses.getAbiForContract(openSTValueContractName)
    , openSTValueContractObj = new web3Provider.eth.Contract(openSTValueContractAbi)
  ;

  oThis.openSTValueContractAddr = coreAddresses.getAddressForContract(openSTValueContractName);
  oThis.VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE;
  oThis.VC_GAS_LIMIT = coreConstants.OST_VALUE_GAS_LIMIT;

  // Helpful while deployement, since ENV variables are not set at that time
  contractAddress = contractAddress || oThis.openSTValueContractAddr;

  this.contractAddress = contractAddress;

  openSTValueContractObj.options.address = contractAddress;

  oThis.openSTValueContractObj = openSTValueContractObj;

  OpsManagedKlass.call(this, contractAddress, web3Provider, openSTValueContractObj, oThis.VC_GAS_PRICE);
};

// adding the methods from OpsMangedContract
OpenSTValueKlass.prototype = Object.create(OpsManagedKlass.prototype);

OpenSTValueKlass.prototype.constructor = OpenSTValueKlass;

OpenSTValueKlass.prototype.openSTValueContractAddr = null;

OpenSTValueKlass.prototype.openSTValueContractObj = null;

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

  if (response.length != 8) {
    let errObj = responseHelper.error({
      internal_error_identifier: 'l_ci_ov_utilityTokens_1',
      api_error_identifier: 'invalid_utility_token',
      error_config: basicHelper.fetchErrorConfig()
    });
    return Promise.resolve(errObj);
  } else {

    const conversionRate = response[2];
    const conversionRateDecimals = response[3];
    var conversionFactor = 0;
    if (response[0] != '') {
      const conversionFactorResponse = basicHelper.convertConversionRateToConversionFactor(conversionRate,
        conversionRateDecimals);
      if (conversionFactorResponse.isSuccess()) {
        conversionFactor = conversionFactorResponse.data.conversionFactor;
      } else {
        return Promise.resolve(conversionFactorResponse);
      }
    }

    return Promise.resolve(responseHelper.successWithData({
      symbol: response[0],
      name: response[1],
      conversion_rate: conversionRate,
      conversion_rate_decimals: conversionRateDecimals,
      conversion_factor: conversionFactor,
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
  const oThis = this
    , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
    , contractInteractHelper  = oThis.ic().getContractInteractHelper()
    , EstimateGasKlass        = oThis.ic().getEstimateGasService()

    , web3Provider = web3ProviderFactory.getProvider('value', 'ws')
    , encodedABI = oThis.openSTValueContractObj.methods.stake(uuid, amountSTWeis, beneficiaryAddr).encodeABI()
  ;
  // estimating gas for the transaction
  const estimateGasObj = new EstimateGasKlass({
    contract_name: openSTValueContractName,
    contract_address: oThis.contractAddress,
    chain: 'value',
    sender_address: senderAddr,
    method_name: 'stake',
    method_arguments: [uuid, amountSTWeis, beneficiaryAddr]
  });

  const estimateGasResponse = await estimateGasObj.perform()
    , gasToUse = estimateGasResponse.data.gas_to_use
  ;

  if (inAsync) {
    return contractInteractHelper.sendTxAsyncFromAddr(
      web3Provider,
      oThis.openSTValueContractAddr,
      encodedABI,
      senderAddr,
      senderPassphrase,
      {gasPrice: oThis.VC_GAS_PRICE, gas: gasToUse}
    );
  } else {
    const transactionReceiptResult = await contractInteractHelper.safeSendFromAddr(
      web3Provider,
      oThis.openSTValueContractAddr,
      encodedABI,
      senderAddr,
      senderPassphrase,
      {gasPrice: oThis.VC_GAS_PRICE, gas: gasToUse}
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
  const oThis = this
    , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
    , contractInteractHelper  = oThis.ic().getContractInteractHelper()
    , EstimateGasKlass        = oThis.ic().getEstimateGasService()

    , web3Provider = web3ProviderFactory.getProvider('value', 'ws')
  ;

  const encodedABI = oThis.openSTValueContractObj.methods.processStaking(stakingIntentHash).encodeABI();

  // estimating gas for the transaction
  const estimateGasObj = new EstimateGasKlass({
    contract_name: openSTValueContractName,
    contract_address: oThis.contractAddress,
    chain: 'value',
    sender_address: senderAddr,
    method_name: 'processStaking',
    method_arguments: [stakingIntentHash]
  });

  const estimateGasResponse = await estimateGasObj.perform()
    , gasToUse = estimateGasResponse.data.gas_to_use
  ;

  const transactionReceiptResult = await contractInteractHelper.safeSendFromAddr(
    web3Provider,
    oThis.openSTValueContractAddr,
    encodedABI,
    senderAddr,
    senderPassphrase,
    {gasPrice: oThis.VC_GAS_PRICE, gas: gasToUse}
  );

  logger.debug('process staking -------------------------------------------------------');
  logger.debug(JSON.stringify(transactionReceiptResult));
  logger.debug('-------------------------------------------------------');

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

  const oThis = this
    , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
    , contractInteractHelper  = oThis.ic().getContractInteractHelper()

    , web3Provider = web3ProviderFactory.getProvider('value', 'ws')
  ;

  const encodedABI = oThis.openSTValueContractObj.methods.processUnstaking(redeemptionIntentHash).encodeABI();

  const transactionReceiptResult = await contractInteractHelper.safeSendFromAddr(
    web3Provider,
    oThis.openSTValueContractAddr,
    encodedABI,
    senderAddr,
    senderPassphrase,
    {gasPrice: oThis.VC_GAS_PRICE, gas: oThis.VC_GAS_LIMIT}
  );

  logger.debug('process staking -------------------------------------------------------');
  logger.debug(JSON.stringify(transactionReceiptResult));
  logger.debug('-------------------------------------------------------');

  return Promise.resolve(transactionReceiptResult);

};

/**
 * Get stake info using staking intent hash
 *
 * @param {string} stakingIntentHash - staking intent hash
 *
 * @return {promise}
 */
OpenSTValueKlass.prototype.getActiveStake = async function (stakingIntentHash) {
  const oThis = this
    , callMethodResult = await oThis._callMethod('stakes', [stakingIntentHash])
    , response = callMethodResult.data.stakes;

  return Promise.resolve(responseHelper.successWithData({
    active_stake: {
      uuid: response[0],
      staker: response[1],
      beneficiary: response[2],
      nonce: response[3],
      amountST: response[4],
      amountUT: response[5],
      unlockHeight: response[6]
    }
  }));
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
OpenSTValueKlass.prototype._callMethod = function (methodName, args) {

  const oThis = this
    , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
    , contractInteractHelper  = oThis.ic().getContractInteractHelper()

    , web3Provider = web3ProviderFactory.getProvider('value', 'ws')
    , scope = oThis.openSTValueContractObj.methods
    , transactionObject = scope[methodName].apply(scope, (args || []))
    , encodeABI = transactionObject.encodeABI()
    , transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject)
    , resultData = {};

  return contractInteractHelper.call(web3Provider, oThis.contractAddress, encodeABI, {}, transactionOutputs)
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
      return responseHelper.error({
        internal_error_identifier: 'l_ci_ov_callMethod_' + methodName + '_1',
        api_error_identifier: 'something_went_wrong',
        error_config: basicHelper.fetchErrorConfig()
      });
    })
    ;
};

InstanceComposer.registerShadowableClass(OpenSTValueKlass, "getOpenSTValueInteractClass");

module.exports = OpenSTValueKlass;