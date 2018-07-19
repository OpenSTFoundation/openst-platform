"use strict";

/**
 *
 * Contract interaction methods for Value Registrar Contract.<br><br>
 *
 * @module lib/contract_interact/value_registrar
 *
 */

const rootPrefix = "../.."
  , InstanceComposer = require( rootPrefix + "/instance_composer")
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , responseHelper = require(rootPrefix + "/lib/formatter/response")
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  /**
   Note: OpsManagedKlass is a special case here. OpsManagedKlass is derived from it.
   Hence, dont worry, you dont need to use oThis.ic().getOwnedInteractClass()
   **/
  , OpsManagedKlass = require(rootPrefix + '/lib/contract_interact/ops_managed')
;

require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/lib/contract_interact/helper');

const valueRegistrarContractName = 'valueRegistrar'
;

/**
 * Constructor for Value Registrar Contract Interact
 *
 * @constructor
 * @augments OpsManagedKlass
 *
 * @param {String} contractAddress - address where Contract has been deployed
 *
 */
const ValueRegistrarKlass = function (contractAddress) {

  const oThis = this
    , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
    , coreConstants = oThis.ic().getCoreConstants()
    , coreAddresses = oThis.ic().getCoreAddresses()
    , web3Provider = web3ProviderFactory.getProvider('value', 'ws')

    , valueRegistrarContractAbi = coreAddresses.getAbiForContract(valueRegistrarContractName)
    , valueRegistrarContractObj = new web3Provider.eth.Contract(valueRegistrarContractAbi)
  ;

  oThis.contractAddress = contractAddress;

  oThis.VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE;
  oThis.VC_GAS_LIMIT = coreConstants.OST_VALUE_GAS_LIMIT;

  valueRegistrarContractObj.options.address = oThis.contractAddress;
  //valueRegistrarContractObj.setProvider(web3Provider.currentProvider);

  OpsManagedKlass.call(this, oThis.contractAddress, web3Provider, valueRegistrarContractObj, oThis.VC_GAS_PRICE);

};

// adding the methods from OpsManged Contract
ValueRegistrarKlass.prototype = Object.create(OpsManagedKlass.prototype);

ValueRegistrarKlass.prototype.constructor = ValueRegistrarKlass;

/**
 * Add Core on value chain
 *
 * @param {string} senderName - address which sent register BT request
 * @param {string} registry - address of OpenSTValue registry
 * @param {string} coreContractAddress - address where core contract is deployed
 *
 * @return {promise<result>}
 *
 */
ValueRegistrarKlass.prototype.addCore = function (senderName, registry, coreContractAddress) {

  const oThis = this
    , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
    , web3Provider = web3ProviderFactory.getProvider('value', 'ws')
  ;

  const encodedABI = valueRegistrarContractObj.methods.addCore(registry, coreContractAddress).encodeABI();

  return contractInteractHelper.safeSend(
    web3Provider,
    this.contractAddress,
    encodedABI,
    senderName,
    {gasPrice: oThis.VC_GAS_PRICE, gas: oThis.VC_GAS_LIMIT}
  );

};

/**
 * Register Utility Token
 *
 * @param {string} senderAddress - address which sent register BT request
 * @param {string} senderPassphrase - passphrase of senderAddress
 * @param {string} registry - address of OpenSTUtility registry
 * @param {string} symbol - member company symbol
 * @param {string} name -  member company name
 * @param {number} conversionRate -  member company conversation rate wrt ST
 * @param {number} conversionRateDecimals -  member company conversation rate decimals
 * @param {string} utilityChainId - chain id of utility chain where BT transactions would reside
 * @param {string} requester - address of requester
 * @param {string} checkUuid - UUID for validating transaction
 *
 * @return {promise<result>}
 *
 */
ValueRegistrarKlass.prototype.registerUtilityToken = async function (senderAddress, senderPassphrase,
                                                                     registry, symbol, name, conversionRate,
                                                                     conversionRateDecimals, utilityChainId,
                                                                     requester, checkUuid) {

  const oThis = this
    , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
    , web3Provider = web3ProviderFactory.getProvider('value', 'ws')
  ;

  //Calculate gas required for proposing branded token.
  const gasToUse = await valueRegistrarContractObj.methods
    .registerUtilityToken(registry, symbol, name, conversionRate, conversionRateDecimals, utilityChainId, requester, checkUuid)
    .estimateGas({from: senderAddress, gasPrice: oThis.VC_GAS_PRICE});

  if (Number(gasToUse) === Number(oThis.VC_GAS_LIMIT)) {
    let errObj = responseHelper.error({
      internal_error_identifier: 'l_ci_vr_registerUtilityToken_1',
      api_error_identifier: 'something_went_wrong',
      error_config: basicHelper.fetchErrorConfig()
    });
    return Promise.resolve(errObj);
  }

  const encodedABI = valueRegistrarContractObj.methods.registerUtilityToken(registry, symbol, name, conversionRate,
    conversionRateDecimals, utilityChainId, requester, checkUuid).encodeABI();

  return contractInteractHelper.safeSendFromAddr(
    web3Provider,
    this.contractAddress,
    encodedABI,
    senderAddress,
    senderPassphrase,
    {gasPrice: oThis.VC_GAS_PRICE, gas: gasToUse}
  );

};

/**
 * Confirm Redemption Intent
 *
 * @param {string} senderAddress - address which sent register BT request
 * @param {string} senderPassphrase - passphrase of senderAddress
 * @param {string} registryContractAddr - registry contract address
 * @param {string} uuid - UUID for validating transaction
 * @param {string} redeemerAddr - redeemer address
 * @param {string} redeemerNonce -  redeemer noonce
 * @param {string} amountUT -  amount of BT
 * @param {number} redemptionUnlockHeight -
 * @param {string} redemptionIntentHash -
 *
 * @return {Promise}
 *
 */
ValueRegistrarKlass.prototype.confirmRedemptionIntent = function (senderAddress, senderPassphrase,
                                                                  registryContractAddr, uuid, redeemerAddr,
                                                                  redeemerNonce, amountUT, redemptionUnlockHeight,
                                                                  redemptionIntentHash) {

  const oThis = this
    , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
    , web3Provider = web3ProviderFactory.getProvider('value', 'ws')
  ;

  const encodedABI = valueRegistrarContractObj.methods.confirmRedemptionIntent(registryContractAddr, uuid,
    redeemerAddr, redeemerNonce, amountUT, redemptionUnlockHeight, redemptionIntentHash).encodeABI();

  return contractInteractHelper.safeSendFromAddr(
    web3Provider,
    this.contractAddress,
    encodedABI,
    senderAddress,
    senderPassphrase,
    {gasPrice: oThis.VC_GAS_PRICE, gas: oThis.VC_GAS_LIMIT}
  );

};

InstanceComposer.registerShadowableClass(ValueRegistrarKlass, "getValueRegistrarInteractClass");

module.exports = ValueRegistrarKlass;