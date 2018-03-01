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
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , OwnedKlass = require(rootPrefix + '/lib/contract_interact/owned')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

const openSTUtilityContractName = 'openSTUtility'
  , openSTUtilityContractAbi = coreAddresses.getAbiForContract(openSTUtilityContractName)
  , openSTUtilityContractAddr = coreAddresses.getAddressForContract(openSTUtilityContractName)
  , UC_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE
  , UC_GAS_LIMIT = coreConstants.OST_UTILITY_GAS_LIMIT
  , openSTUtilityContractObj = new web3RpcProvider.eth.Contract(openSTUtilityContractAbi)
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
  // Helpful while deployement, since ENV variables are not set at that time
  contractAddress = contractAddress || openSTUtilityContractAddr;

  const oThis = this;

  oThis.contractAddress = contractAddress;

  openSTUtilityContractObj.options.address = contractAddress;
  openSTUtilityContractObj.setProvider(web3RpcProvider.currentProvider);

  OwnedKlass.call(oThis, contractAddress, web3RpcProvider, openSTUtilityContractObj, UC_GAS_PRICE)

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

  //Calculate gas required for proposing branded token.
  var gasToUse = await openSTUtilityContractObj.methods.proposeBrandedToken(symbol, name, conversionRate, conversionRateDecimals).estimateGas({
    from: senderAddress, gasPrice: UC_GAS_PRICE, gas: UC_GAS_LIMIT
  });

  const encodedABI = openSTUtilityContractObj.methods.proposeBrandedToken(symbol, name, conversionRate, conversionRateDecimals).encodeABI();

  if (Number(gasToUse) === Number(UC_GAS_LIMIT)) {
    return Promise.resolve(responseHelper.error('l_ci_ou_proposeBrandedToken_1', 'Something went wrong. Please check if token is not already proposed.'));
  }

  return contractInteractHelper.sendTxAsyncFromAddr(
    web3RpcProvider,
    openSTUtilityContractAddr,
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
  //Calculate gas required
  const gasToUse = await openSTUtilityContractObj.methods.redeem(uuid, amountBT, nonce, beneficiaryAddr).estimateGas({
    from: senderAddress, gasPrice: UC_GAS_PRICE, gas: UC_GAS_LIMIT
  });

  const encodedABI = openSTUtilityContractObj.methods.redeem(uuid, amountBT, nonce, beneficiaryAddr).encodeABI();

  if (Number(gasToUse) === Number(UC_GAS_LIMIT)) {
    return Promise.resolve(responseHelper.error('l_ci_ou_redeem_1', 'Max gas will be used, as per the estimated gas. Check the params.'));
  }

  if (inAsync) {
    return contractInteractHelper.sendTxAsyncFromAddr(
      web3RpcProvider,
      openSTUtilityContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {
        gasPrice: UC_GAS_PRICE,
        gas: gasToUse
      }
    );
  } else {
    return contractInteractHelper.safeSendFromAddr(
      web3RpcProvider,
      openSTUtilityContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {
        gasPrice: UC_GAS_PRICE,
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

  const sanitizedAmount = web3RpcProvider.utils.toHex(web3RpcProvider.utils.toWei(amountSTPrime.toString()));

  //Calculate gas required
  const gasToUse = await openSTUtilityContractObj.methods.redeemSTPrime(nonce, beneficiaryAddr).estimateGas({
    from: senderAddress, gasPrice: UC_GAS_PRICE, value: sanitizedAmount, gas: UC_GAS_LIMIT
  });

  if (Number(gasToUse) === Number(UC_GAS_LIMIT)) {
    return Promise.resolve(
      responseHelper.error('l_ci_ou_redeemSTPrime_1', 'Max gas will be used, as per the estimated gas. Check the params.')
    );
  }

  const encodedABI = openSTUtilityContractObj.methods.redeemSTPrime(nonce, beneficiaryAddr).encodeABI();

  if (inAsync) {
    return contractInteractHelper.sendTxAsyncFromAddr(
      web3RpcProvider,
      openSTUtilityContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {
        gasPrice: UC_GAS_PRICE,
        gas: gasToUse,
        value: sanitizedAmount
      }
    );
  } else {
    return contractInteractHelper.safeSendFromAddr(
      web3RpcProvider,
      openSTUtilityContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {
        gasPrice: UC_GAS_PRICE,
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

  const encodedABI = openSTUtilityContractObj.methods.processRedeeming(redeemptionIntentHash).encodeABI();

  const transactionReceiptResult = await contractInteractHelper.safeSendFromAddr(
    web3RpcProvider,
    openSTUtilityContractAddr,
    encodedABI,
    redeemerAddress,
    redeemerPassphrase,
    {gasPrice: UC_GAS_PRICE, gas: UC_GAS_LIMIT}
  );

  logger.info('process staking -------------------------------------------------------');
  logger.info(JSON.stringify(transactionReceiptResult));
  logger.info('-------------------------------------------------------');

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
OpenStUtilityKlass.prototype.processMinting = async function (senderAddress,senderPassphrase, stakingIntentHash) {

  const encodedABI = openSTUtilityContractObj.methods.processMinting(stakingIntentHash).encodeABI();

  const currentGasPrice = new BigNumber(await web3RpcProvider.eth.getGasPrice())
  ;

  const transactionReceiptResult = await contractInteractHelper.safeSendFromAddr(
    web3RpcProvider,
    openSTUtilityContractAddr,
    encodedABI,
    senderAddress,
    senderPassphrase,
    {
      gasPrice: (currentGasPrice.equals(0) ? '0x0' : UC_GAS_PRICE),
      gas: UC_GAS_LIMIT
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

  return Promise.resolve(responseHelper.successWithData({active_mint: {
    uuid: response[0],
    staker: response[1],
    beneficiary: response[2],
    amount: response[3],
    expirationHeight: response[4]
  }}));
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
OpenStUtilityKlass.prototype._callMethod = function(methodName, args) {

  const oThis = this
    , scope = openSTUtilityContractObj.methods
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
      return responseHelper.error('l_ci_ou_callMethod_'+methodName+'_1', 'Something went wrong');
    })
    ;
};

module.exports = OpenStUtilityKlass;