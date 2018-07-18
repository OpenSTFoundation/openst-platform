"use strict";

/**
 * Contract interaction methods for OpenST Utility Contract.<br><br>
 *
 * @module lib/contract_interact/openst_utility
 *
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = '../..'
  , InstanceComposer = require(rootPrefix + "/instance_composer")
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , OwnedKlass = require(rootPrefix + '/lib/contract_interact/owned')
;

require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/lib/contract_interact/helper');
require(rootPrefix + '/services/transaction/estimate_gas');

const openSTUtilityContractName = 'openSTUtility'
;

/**
 * OpenST Utility Contract constructor
 *
 * @constructor
 * @augments OwnedKlass
 *
 * @param {string} contractAddress - address on Utility Chain where Contract has been deployed
 */
const OpenStUtilityKlass = function (contractAddress) {
  const oThis = this
    , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
    , coreAddresses = oThis.ic().getCoreAddresses()
    , coreConstants = oThis.ic().getCoreConstants()

    , web3Provider = web3ProviderFactory.getProvider('utility', 'ws')
    , openSTUtilityContractAbi = coreAddresses.getAbiForContract(openSTUtilityContractName)
    , openSTUtilityContractObj = new web3Provider.eth.Contract(openSTUtilityContractAbi)
  ;

  oThis.openSTUtilityContractAddr = coreAddresses.getAddressForContract(openSTUtilityContractName);
  oThis.UC_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE;
  oThis.UC_GAS_LIMIT = coreConstants.OST_UTILITY_GAS_LIMIT;

  // Helpful while deployement, since ENV variables are not set at that time
  contractAddress = contractAddress || oThis.openSTUtilityContractAddr;

  oThis.contractAddress = contractAddress;

  openSTUtilityContractObj.options.address = contractAddress;
  //openSTUtilityContractObj.setProvider(web3Provider.currentProvider);

  OwnedKlass.call(oThis, contractAddress, web3Provider, openSTUtilityContractObj, oThis.UC_GAS_PRICE)

};

// adding the methods from OpsMangedContract
OpenStUtilityKlass.prototype = Object.create(OwnedKlass.prototype);

OpenStUtilityKlass.prototype.constructor = OpenStUtilityKlass;

/**
 * Fetch Address on Utility Chain where STPrime Contract has been deployed
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityKlass.prototype.getSimpleTokenPrimeContractAddress = async function () {
  const oThis = this
    , callMethodResult = await oThis._callMethod('simpleTokenPrime')
    , response = callMethodResult.data.simpleTokenPrime;
  return Promise.resolve(responseHelper.successWithData({simpleTokenPrimeContractAddress: response[0]}));
};

/**
 * Fetch UUID of STPrime Contract
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityKlass.prototype.getSimpleTokenPrimeUUID = async function () {
  const oThis = this
    , callMethodResult = await oThis._callMethod('uuidSTPrime')
    , response = callMethodResult.data.uuidSTPrime;
  return Promise.resolve(responseHelper.successWithData({simpleTokenPrimeUUID: response[0]}));
};

/**
 * Get Symbol of STPrime
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityKlass.prototype.getSimpleTokenPrimeSymbol = async function () {
  const oThis = this
    , callMethodResult = await oThis._callMethod('STPRIME_SYMBOL')
    , response = callMethodResult.data.STPRIME_SYMBOL;
  return Promise.resolve(responseHelper.successWithData({symbol: response[0]}));
};

/**
 * Get Name of STPrime
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityKlass.prototype.getSimpleTokenPrimeName = async function () {
  const oThis = this
    , callMethodResult = await oThis._callMethod('STPRIME_NAME')
    , response = callMethodResult.data.STPRIME_NAME;
  return Promise.resolve(responseHelper.successWithData({name: response[0]}));
};

/**
 * Get Conversion Rate of STPrime
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityKlass.prototype.getSimpleTokenPrimeConversationRate = async function () {
  const oThis = this
    , callMethodResult = await oThis._callMethod('STPRIME_CONVERSION_RATE')
    , response = callMethodResult.data.STPRIME_CONVERSION_RATE;
  return Promise.resolve(responseHelper.successWithData({conversion_rate: response[0]}));
};

/**
 * Get Conversion Rate Decimals of STPrime
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityKlass.prototype.getSimpleTokenPrimeConversationRateDecimals = async function () {
  const oThis = this
    , callMethodResult = await oThis._callMethod('STPRIME_CONVERSION_RATE_TOKEN_DECIMALS')
    , response = callMethodResult.data.STPRIME_CONVERSION_RATE_TOKEN_DECIMALS;
  return Promise.resolve(responseHelper.successWithData({conversion_rate_decimals: response[0]}));
};

/**
 * Get registered token property from the uuid
 *
 * @param {string} uuid - Branded token uuid
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityKlass.prototype.registeredToken = async function (uuid) {
  const oThis = this
    , callMethodResult = await oThis._callMethod('registeredTokens', [uuid])
    , response = callMethodResult.data.registeredTokens;
  return Promise.resolve(responseHelper.successWithData({erc20Address: response[0]}));
};

/**
 * Propose Branded Token - this will be called from outside the package, so using sendTxAsyncFromAddr
 *
 * @param {string} senderAddress - sender's address which is proposing BT
 * @param {string} senderPassphrase - passphrase of senderPassphrase
 * @param {string} symbol - symbol of Token which is being Proposed
 * @param {string} name - name of Token which is being Proposed
 * @param {string} conversionRate - conversion rate with respect to ST of Token which is being Proposed
 * @param {number} conversionRateDecimals - conversation rate decimals
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityKlass.prototype.proposeBrandedToken = async function (senderAddress,
                                                                   senderPassphrase,
                                                                   symbol,
                                                                   name, conversionRate, conversionRateDecimals) {
  const oThis = this
    , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
    , coreAddresses = oThis.ic().getCoreAddresses()
    , contractInteractHelper = oThis.ic().getContractInteractHelper()

    , web3Provider = web3ProviderFactory.getProvider('utility', 'ws')
    , openSTUtilityContractAbi = coreAddresses.getAbiForContract(openSTUtilityContractName)
    , openSTUtilityContractObj = new web3Provider.eth.Contract(openSTUtilityContractAbi)
  ;

  //Calculate gas required for proposing branded token.
  var gasToUse = await openSTUtilityContractObj.methods.proposeBrandedToken(symbol, name, conversionRate, conversionRateDecimals).estimateGas({
    from: senderAddress, gasPrice: oThis.UC_GAS_PRICE, gas: oThis.UC_GAS_LIMIT
  });

  const encodedABI = openSTUtilityContractObj.methods.proposeBrandedToken(symbol, name, conversionRate, conversionRateDecimals).encodeABI();

  if (Number(gasToUse) === Number(oThis.UC_GAS_LIMIT)) {
    let errObj = responseHelper.error({
      internal_error_identifier: 'l_ci_ou_proposeBrandedToken_1',
      api_error_identifier: 'transaction_failed',
      error_config: basicHelper.fetchErrorConfig()
    });
    return Promise.resolve(errObj);
  }

  const transaction_hash = await contractInteractHelper.sendTxAsyncFromAddr(
    web3Provider,
    oThis.openSTUtilityContractAddr,
    encodedABI,
    senderAddress,
    senderPassphrase,
    {
      gasPrice: oThis.UC_GAS_PRICE,
      gas: gasToUse
    }
  );

  return Promise.resolve(responseHelper.successWithData({transaction_hash: transaction_hash}));

};

/**
 * Initiate redeem for branded token
 *
 * @param {string} senderAddress - sender address
 * @param {string} senderPassphrase - sender address passphrase
 * @param {string} uuid - uuid of the branded token
 * @param {number} amountBT - amount of Branded token to be redeemed
 * @param {number} nonce - nonce to be used
 * @param {string} beneficiaryAddr - beneficiary address
 * @param {boolean} inAsync - true of one wants only the transaction hash and not wait till the mining
 *
 * @return {promise}
 *
 */
OpenStUtilityKlass.prototype.redeem = async function (senderAddress, senderPassphrase, uuid,
                                                      amountBT, nonce, beneficiaryAddr, inAsync) {
  const oThis = this
    , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
    , coreAddresses = oThis.ic().getCoreAddresses()
    , contractInteractHelper = oThis.ic().getContractInteractHelper()

    , web3Provider = web3ProviderFactory.getProvider('utility', 'ws')
    , openSTUtilityContractAbi = coreAddresses.getAbiForContract(openSTUtilityContractName)
    , openSTUtilityContractObj = new web3Provider.eth.Contract(openSTUtilityContractAbi)
  ;

  //Calculate gas required
  const gasToUse = await openSTUtilityContractObj.methods.redeem(uuid, amountBT, nonce, beneficiaryAddr).estimateGas({
    from: senderAddress, gasPrice: oThis.UC_GAS_PRICE, gas: oThis.UC_GAS_LIMIT
  });

  const encodedABI = openSTUtilityContractObj.methods.redeem(uuid, amountBT, nonce, beneficiaryAddr).encodeABI();

  if (Number(gasToUse) === Number(oThis.UC_GAS_LIMIT)) {
    let errObj = responseHelper.error({
      internal_error_identifier: 'l_ci_ou_redeem_1',
      api_error_identifier: 'max_gas_consumed',
      error_config: basicHelper.fetchErrorConfig()
    });
    return Promise.resolve(errObj);
  }

  if (inAsync) {
    return contractInteractHelper.sendTxAsyncFromAddr(
      web3Provider,
      oThis.openSTUtilityContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {
        gasPrice: oThis.UC_GAS_PRICE,
        gas: gasToUse
      }
    );
  } else {
    return contractInteractHelper.safeSendFromAddr(
      web3Provider,
      oThis.openSTUtilityContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {
        gasPrice: oThis.UC_GAS_PRICE,
        gas: gasToUse
      }
    );
  }
};

/**
 * Initiate redeem for ST'
 *
 * @param {string} senderAddress - address of the redeemer
 * @param {string} senderPassphrase - passphrase of the redeemer
 * @param {BigNumber} amountSTPrime - amount of ST Prime
 * @param {number} nonce - nonce to be used
 * @param {string} beneficiaryAddr - beneficiary address
 * @param {boolean} inAsync - true of one wants only the transaction hash and not wait till the mining
 *
 * @return {promise}
 *
 */
OpenStUtilityKlass.prototype.redeemSTPrime = async function (senderAddress, senderPassphrase,
                                                             amountSTPrime, nonce, beneficiaryAddr, inAsync) {

  const oThis = this
    , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
    , coreAddresses = oThis.ic().getCoreAddresses()
    , contractInteractHelper = oThis.ic().getContractInteractHelper()

    , web3Provider = web3ProviderFactory.getProvider('utility', 'ws')
    , openSTUtilityContractAbi = coreAddresses.getAbiForContract(openSTUtilityContractName)
    , openSTUtilityContractObj = new web3Provider.eth.Contract(openSTUtilityContractAbi)
  ;

  const sanitizedAmount = web3Provider.utils.toHex(web3Provider.utils.toWei(amountSTPrime.toString()));

  //Calculate gas required
  const gasToUse = await openSTUtilityContractObj.methods.redeemSTPrime(nonce, beneficiaryAddr).estimateGas({
    from: senderAddress, gasPrice: oThis.UC_GAS_PRICE, value: sanitizedAmount, gas: oThis.UC_GAS_LIMIT
  });

  if (Number(gasToUse) === Number(oThis.UC_GAS_LIMIT)) {
    let errObj = responseHelper.error({
      internal_error_identifier: 'l_ci_ou_redeemSTPrime_1',
      api_error_identifier: 'max_gas_consumed',
      error_config: basicHelper.fetchErrorConfig()
    });
    return Promise.resolve(errObj);
  }

  const encodedABI = openSTUtilityContractObj.methods.redeemSTPrime(nonce, beneficiaryAddr).encodeABI();

  if (inAsync) {
    return contractInteractHelper.sendTxAsyncFromAddr(
      web3Provider,
      oThis.openSTUtilityContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {
        gasPrice: oThis.UC_GAS_PRICE,
        gas: gasToUse,
        value: sanitizedAmount
      }
    );
  } else {
    return contractInteractHelper.safeSendFromAddr(
      web3Provider,
      oThis.openSTUtilityContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {
        gasPrice: oThis.UC_GAS_PRICE,
        gas: gasToUse,
        value: sanitizedAmount
      }
    );
  }
};

/**
 * Process redeeming
 *
 * @param {string} redeemerAddress - address of redeemer
 * @param {string} redeemerPassphrase - passphrase of redeemer
 * @param {string} redeemptionIntentHash - intent hash which was returned in event data of Stake method
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityKlass.prototype.processRedeeming = async function (redeemerAddress, redeemerPassphrase, redeemptionIntentHash) {

  const oThis = this
    , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
    , coreAddresses = oThis.ic().getCoreAddresses()
    , contractInteractHelper = oThis.ic().getContractInteractHelper()

    , web3Provider = web3ProviderFactory.getProvider('utility', 'ws')
    , openSTUtilityContractAbi = coreAddresses.getAbiForContract(openSTUtilityContractName)
    , openSTUtilityContractObj = new web3Provider.eth.Contract(openSTUtilityContractAbi)
  ;

  const encodedABI = openSTUtilityContractObj.methods.processRedeeming(redeemptionIntentHash).encodeABI();

  const transactionReceiptResult = await contractInteractHelper.safeSendFromAddr(
    web3Provider,
    oThis.openSTUtilityContractAddr,
    encodedABI,
    redeemerAddress,
    redeemerPassphrase,
    {gasPrice: oThis.UC_GAS_PRICE, gas: oThis.UC_GAS_LIMIT}
  );

  logger.debug('process staking -------------------------------------------------------');
  logger.debug(JSON.stringify(transactionReceiptResult));
  logger.debug('-------------------------------------------------------');

  //return => tokenAddress;
  return Promise.resolve(transactionReceiptResult);

};

/**
 * Process Minting
 *
 * @param {string} senderAddress - sender address who is initiating process minting
 * @param {string} senderPassphrase - sender's passphrase
 * @param {string} stakingIntentHash - this is the hash created using the stake params
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityKlass.prototype.processMinting = async function (senderAddress, senderPassphrase, stakingIntentHash) {

  const oThis = this
    , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
    , coreAddresses = oThis.ic().getCoreAddresses()
    , contractInteractHelper = oThis.ic().getContractInteractHelper()
    , EstimateGasKlass = oThis.ic().getEstimateGasService()

    , web3Provider = web3ProviderFactory.getProvider('utility', 'ws')
    , openSTUtilityContractAbi = coreAddresses.getAbiForContract(openSTUtilityContractName)
    , openSTUtilityContractObj = new web3Provider.eth.Contract(openSTUtilityContractAbi)
    , encodedABI = openSTUtilityContractObj.methods.processMinting(stakingIntentHash).encodeABI()
    , currentGasPrice = new BigNumber(await web3Provider.eth.getGasPrice())
  ;

  // estimating gas for the transaction
  const estimateGasObj = new EstimateGasKlass({
    contract_name: openSTUtilityContractName,
    contract_address: oThis.contractAddress,
    chain: 'utility',
    sender_address: senderAddress,
    method_name: 'processMinting',
    method_arguments: [stakingIntentHash]
  });

  const estimateGasResponse = await estimateGasObj.perform()
    , gasToUse = estimateGasResponse.data.gas_to_use
  ;

  const transactionReceiptResult = await contractInteractHelper.safeSendFromAddr(
    web3Provider,
    oThis.openSTUtilityContractAddr,
    encodedABI,
    senderAddress,
    senderPassphrase,
    {
      gasPrice: (currentGasPrice.equals(0) ? '0x0' : oThis.UC_GAS_PRICE),
      gas: gasToUse
    }
  );

  //return => tokenAddress;
  return Promise.resolve(transactionReceiptResult);

};

/**
 * Get active mint using staking intent hash
 *
 * @param {string} stakingIntentHash - staking intent hash
 *
 * @return {promise}
 */
OpenStUtilityKlass.prototype.getActiveMint = async function (stakingIntentHash) {
  const oThis = this
    , callMethodResult = await oThis._callMethod('mints', [stakingIntentHash])
    , response = callMethodResult.data.mints;

  return Promise.resolve(responseHelper.successWithData({
    active_mint: {
      uuid: response[0],
      staker: response[1],
      beneficiary: response[2],
      amount: response[3],
      expirationHeight: response[4]
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
OpenStUtilityKlass.prototype._callMethod = function (methodName, args) {

  const oThis = this
    , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
    , coreAddresses = oThis.ic().getCoreAddresses()
    , contractInteractHelper = oThis.ic().getContractInteractHelper()

    , web3Provider = web3ProviderFactory.getProvider('utility', 'ws')
    , openSTUtilityContractAbi = coreAddresses.getAbiForContract(openSTUtilityContractName)
    , openSTUtilityContractObj = new web3Provider.eth.Contract(openSTUtilityContractAbi)
    , scope = openSTUtilityContractObj.methods
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
        internal_error_identifier: 'l_ci_ou_callMethod_' + methodName + '_1',
        api_error_identifier: 'something_went_wrong',
        error_config: basicHelper.fetchErrorConfig()
      });
    })
    ;
};

InstanceComposer.registerShadowableClass(OpenStUtilityKlass, "getOpenSTUtilityeInteractClass");

module.exports = OpenStUtilityKlass;