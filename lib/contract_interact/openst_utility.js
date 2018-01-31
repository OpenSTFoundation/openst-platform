"use strict";

/**
 * Contract interaction methods for OpenST Utility Contract.<br><br>
 *
 * @module lib/contract_interact/openst_utility
 *
 */

const rootPrefix = '../..'
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , OwnedContract = require(rootPrefix + '/lib/contract_interact/owned_contract')
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
 * @constructor
 * @augments OwnedContract
 *
 * @param {string} contractAddress - address on Utility Chain where Contract has been deployed
 */
const OpenStUtilityContractInteractKlass = function (contractAddress) {

  contractAddress = contractAddress || openSTUtilityContractAddr;

  this.contractAddress = contractAddress;

  logger.info("OpenStUtilityContractInteract :: contractAddress", contractAddress);

  openSTUtilityContractObj.options.address = contractAddress;
  openSTUtilityContractObj.setProvider(web3RpcProvider.currentProvider);

  OwnedContract.call(this, contractAddress, web3RpcProvider, openSTUtilityContractObj, UC_GAS_PRICE)

};

OpenStUtilityContractInteractKlass.prototype = Object.create(OwnedContract.prototype);

OpenStUtilityContractInteractKlass.prototype.constructor = OpenStUtilityContractInteractKlass;

/**
 * Fetch Address on Utility Chain where STPrime Contract has been deployed
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityContractInteractKlass.prototype.getSimpleTokenPrimeContractAddress = async function () {
  const encodedABI = openSTUtilityContractObj.methods.simpleTokenPrime().encodeABI();
  const response = await contractInteractHelper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, ['address']);
  return Promise.resolve(responseHelper.successWithData({simpleTokenPrimeContractAddress: response[0]}));
};

/**
 * Fetch UUID of STPrime Contract
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityContractInteractKlass.prototype.getSimpleTokenPrimeUUID = async function () {
  const encodedABI = openSTUtilityContractObj.methods.uuidSTPrime().encodeABI();
  const response = await contractInteractHelper.call(web3RpcProvider, this.contractAddress, encodedABI);
  return Promise.resolve(responseHelper.successWithData({simpleTokenPrimeUUID: response}));
};

/**
 * Process Minting
 *
 * @param {string} reserveAddress - reserve's address which is minting
 * @param {string} reservePassphrase - passphrase of reserveAddress
 * @param {string} stakingIntentHash - this is the hash created using the stake params
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityContractInteractKlass.prototype.processMinting = async function (reserveAddress,
                                                                         reservePassphrase, stakingIntentHash) {

  const encodedABI = openSTUtilityContractObj.methods.processMinting(stakingIntentHash).encodeABI();

  const transactionReceiptResult = await contractInteractHelper.safeSendFromAddr(
    web3RpcProvider,
    openSTUtilityContractAddr,
    encodedABI,
    reserveAddress,
    reservePassphrase,
    {gasPrice: UC_GAS_PRICE, gas: 1000000}
  );

  logger.info('process minting -------------------------------------------------------');
  logger.info(JSON.stringify(transactionReceiptResult));
  logger.info('-------------------------------------------------------');

  //return => tokenAddress;
  return Promise.resolve(transactionReceiptResult);

};

/**
 * Get Symbol of STPrime
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityContractInteractKlass.prototype.getSymbol = async function () {
  const transactionObject = openSTUtilityContractObj.methods.STPRIME_SYMBOL();
  const encodedABI = transactionObject.encodeABI();
  const transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject);
  const response = await contractInteractHelper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
  return Promise.resolve(responseHelper.successWithData({symbol: response[0]}));
};

/**
 * Get Name of STPrime
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityContractInteractKlass.prototype.getName = async function () {
  const transactionObject = openSTUtilityContractObj.methods.STPRIME_NAME();
  const encodedABI = transactionObject.encodeABI();
  const transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject);
  const response = await contractInteractHelper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
  return Promise.resolve(responseHelper.successWithData({name: response[0]}));
};

/**
 * Get Conversion Rate of STPrime
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityContractInteractKlass.prototype.getConversationRate = async function () {
  const transactionObject = openSTUtilityContractObj.methods.STPRIME_CONVERSION_RATE();
  const encodedABI = transactionObject.encodeABI();
  const transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject);
  const response = await contractInteractHelper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
  return Promise.resolve(responseHelper.successWithData({conversion_rate: response[0]}));
};

/**
 * Get registered token property from the uuid
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityContractInteractKlass.prototype.registeredTokenProperty = async function (uuid) {
  const transactionObject = openSTUtilityContractObj.methods.registeredTokenProperties(uuid);
  const encodedABI = transactionObject.encodeABI();
  const transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject);
  const response = await contractInteractHelper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);

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
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityContractInteractKlass.prototype.proposeBrandedToken = async function (senderAddress,
                                                                              senderPassphrase, symbol, name, conversionRate) {

  //Calculate gas required for proposing branded token.
  var gasToUse = await openSTUtilityContractObj.methods.proposeBrandedToken(symbol, name, conversionRate).estimateGas({
    from: senderAddress,
    gasPrice: UC_GAS_PRICE
  });

  //TODO: Geth version < 1.7.1 issues with gas estimation. https://github.com/aragon/aragon-core/issues/141
  if (gasToUse < 950000) {
    gasToUse = 950000;
  }

  const encodedABI = openSTUtilityContractObj.methods.proposeBrandedToken(symbol, name, conversionRate).encodeABI();
  logger.info("proposeBrandedToken :: \n\tgasToUse", gasToUse,
    "\n\tsymbol", symbol,
    "\n\tname", name,
    "\n\tconversionRate", conversionRate
  );

  if (Number(gasToUse) === Number(UC_GAS_LIMIT)) {
    return Promise.resolve(responseHelper.error('ci_ou_1', 'Something went wrong'));
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
 * Redeem
 *
 * @param {string} senderAddress - sender address
 * @param {string} senderPassphrase - sender address passphrase
 * @param {string} uuid - uuid of the branded token
 * @param {number} amountBT - amount of Branded token to be redeemed
 * @param {number} nonce - nonce to be used
 * @param {string} beneficiaryAddr - beneficiary address
 * @param {boolean} inAsync - true of one wants only the transaction hash and not wait till the mining
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityContractInteractKlass.prototype.redeem = async function (senderAddress,
                                                                 senderPassphrase,
                                                                 uuid,
                                                                 amountBT,
                                                                 nonce,
                                                                 beneficiaryAddr,
                                                                 inAsync) {
  //Calculate gas required
  const gasToUse = await openSTUtilityContractObj.methods.redeem(uuid, amountBT, nonce, beneficiaryAddr).estimateGas({
    from: senderAddress,
    gasPrice: UC_GAS_PRICE
  });

  const encodedABI = openSTUtilityContractObj.methods.redeem(uuid, amountBT, nonce, beneficiaryAddr).encodeABI();
  logger.info("redeem :: \n\tgasToUse", gasToUse,
    "\n\tuuid", uuid,
    "\n\tamountBT", amountBT,
    "\n\tnonce", nonce,
    "\n\tbeneficiaryAddr", beneficiaryAddr
  );

  if (Number(gasToUse) === Number(UC_GAS_LIMIT)) {
    return Promise.resolve(responseHelper.error('ci_ou_2', 'Max gas will be used, as per the estimated gas. Check the params.'));
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
 * Process redeeming
 *
 * @param {string} redeemerAddress - address of redeemer
 * @param {string} redeemerPassphrase - passphrase of redeemer
 * @param {string} redeemptionIntentHash - intent hash which was returned in event data of Stake method
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityContractInteractKlass.prototype.processRedeeming = async function (redeemerAddress, redeemerPassphrase, redeemptionIntentHash) {

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
 * redeem st prime
 *
 * @param {string} senderAddress - address of the redeemer
 * @param {string} senderPassphrase - passphrase of the redeemer
 * @param {BigNumber} amountSTPrime - amount of ST Prime
 * @param {number} nonce - nonce to be used
 * @param {string} beneficiaryAddr - beneficiary address
 * @param {boolean} inAsync - true of one wants only the transaction hash and not wait till the mining
 *
 * @return {promise<result>}
 *
 */
OpenStUtilityContractInteractKlass.prototype.redeemSTPrime = async function (senderAddress,
                                                                        senderPassphrase,
                                                                        amountSTPrime,
                                                                        nonce,
                                                                        beneficiaryAddr,
                                                                        inAsync) {

  const sanitizedAmount = web3RpcProvider.utils.toHex(web3RpcProvider.utils.toWei(amountSTPrime.toString()));

  //Calculate gas required
  const gasToUse = await openSTUtilityContractObj.methods.redeemSTPrime(nonce, beneficiaryAddr).estimateGas({
    from: senderAddress,
    gasPrice: UC_GAS_PRICE,
    value: sanitizedAmount,
    gas: UC_GAS_LIMIT
  });

  logger.info("redeemSTPrime :: \n\tgasToUse", gasToUse,
    "\n\tamountSTPrime", amountSTPrime,
    "\n\tnonce", nonce,
    "\n\tbeneficiaryAddr", beneficiaryAddr
  );

  if (Number(gasToUse) === Number(UC_GAS_LIMIT)) {
    return Promise.resolve(
      responseHelper.error('ci_ou_3', 'Max gas will be used, as per the estimated gas. Check the params.')
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

module.exports = OpenStUtilityContractInteractKlass;