"use strict";

/**
 *
 * Contract interaction methods for Utility Registrar Contract.<br><br>
 *
 * @module lib/contract_interact/utility_registrar
 *
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = '../..'
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , OpsManagedKlass = require(rootPrefix + '/lib/contract_interact/ops_managed')
  , EstimateGasKlass = require(rootPrefix + '/services/transaction/estimate_gas')
;

const utilityRegistrarContractName = 'utilityRegistrar'
  , utilityRegistrarContractAbi = coreAddresses.getAbiForContract(utilityRegistrarContractName)
  , UC_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE
;
  var utilityRegistrarContractObj = null;

/**
 * Constructor for Utility Registrar Contract Interact
 *
 * @constructor
 * @augments OpsManagedKlass
 *
 * @param {string} contractAddress - address where Contract has been deployed
 *
 */
const UtilityRegistrarKlass = function (contractAddress) {
  utilityRegistrarContractObj = utilityRegistrarContractObj || new (web3ProviderFactory.getProvider('utility','ws')).eth.Contract(utilityRegistrarContractAbi);
  const oThis = this;

  oThis.contractAddress = contractAddress;

  utilityRegistrarContractObj.options.address = oThis.contractAddress;


  OpsManagedKlass.call(oThis, oThis.contractAddress, web3ProviderFactory.getProvider('utility','ws'), utilityRegistrarContractObj, UC_GAS_PRICE);
};

// adding the methods from OpsManged Contract
UtilityRegistrarKlass.prototype = Object.create(OpsManagedKlass.prototype);

UtilityRegistrarKlass.prototype.constructor = UtilityRegistrarKlass;

/**
 * Register Branded Token
 *
 * @param {string} senderAddress - address which sent register BT request
 * @param {string} senderPassphrase - passphrase of senderAddress
 * @param {string} registry - address of OpenSTUtility registry
 * @param {string} symbol - member company symbol
 * @param {string} name -  member company name
 * @param {number} conversionRate -  member company conversation rate wrt ST
 * @param {number} conversionRateDecimals -  member company conversation rate decimals
 * @param {string} requester - address of requester
 * @param {string} brandedToken - ERC20 address of BT
 * @param {string} checkUuid - UUID for validating transaction
 *
 * @return {promise<result>}
 *
 */
UtilityRegistrarKlass.prototype.registerBrandedToken = async function (senderAddress, senderPassphrase, registry, symbol,
                                                                       name, conversionRate, conversionRateDecimals,
                                                                       requester, brandedToken, checkUuid) {

  const oThis = this
  ;

  const encodedABI = utilityRegistrarContractObj.methods.registerBrandedToken(registry, symbol, name, conversionRate,
    conversionRateDecimals, requester, brandedToken, checkUuid).encodeABI();

  // estimating gas for the transaction
  const estimateGasObj = new EstimateGasKlass({
    contract_name: utilityRegistrarContractName,
    contract_address: oThis.contractAddress,
    chain: 'utility',
    sender_address: senderAddress,
    method_name: 'registerBrandedToken',
    method_arguments: [registry, symbol, name, conversionRate,
      conversionRateDecimals, requester, brandedToken, checkUuid]
  });

  const estimateGasResponse = await estimateGasObj.perform()
    , gasToUse = estimateGasResponse.data.gas_to_use
  ;

  return contractInteractHelper.safeSendFromAddr(
    web3ProviderFactory.getProvider('utility','ws'),
    this.contractAddress,
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
 * Confirm Staking Intent
 *
 * @param {string} senderAddress - address which sent register BT request
 * @param {string} senderPassphrase - passphrase of senderAddress
 * @param {string} registryContractAddr - registry Contract Addrress
 * @param {string} uuid - UUID for validating transaction
 * @param {string} stakerAddr - staker Address
 * @param {string} stakerNonce -  staker nonce
 * @param {string} beneficiary -  beneficiary address
 * @param {string} amountST - amount of ST being staked
 * @param {string} amountUT - amount of BT being minted
 * @param {number} stakingUnlockHeight -
 * @param {string} stakingIntentHash -
 * @param {boolean} inAsync - true if one wants only the transaction hash and not wait till the mining
 *
 * @return {promise<result>}
 *
 */
UtilityRegistrarKlass.prototype.confirmStakingIntent = async function (senderAddress, senderPassphrase, registryContractAddr,
                                                                       uuid, stakerAddr, stakerNonce, beneficiary,
                                                                       amountST, amountUT, stakingUnlockHeight,
                                                                       stakingIntentHash, inAsync) {

  const oThis = this
    , web3Provider = web3ProviderFactory.getProvider('utility','ws')
    , currentGasPrice = new BigNumber(await web3Provider.eth.getGasPrice())
    , gasPrice = (currentGasPrice.equals(0) ? '0x0' : UC_GAS_PRICE)
  ;

  const encodedABI = utilityRegistrarContractObj.methods.confirmStakingIntent(registryContractAddr, uuid, stakerAddr,
    stakerNonce, beneficiary, amountST, amountUT, stakingUnlockHeight, stakingIntentHash).encodeABI();

  // estimating gas for the transaction
  const estimateGasObj = new EstimateGasKlass({
    contract_name: utilityRegistrarContractName,
    contract_address: oThis.contractAddress,
    chain: 'utility',
    sender_address: senderAddress,
    method_name: 'confirmStakingIntent',
    method_arguments: [registryContractAddr, uuid, stakerAddr,
      stakerNonce, beneficiary, amountST, amountUT, stakingUnlockHeight, stakingIntentHash]
  });

  const estimateGasResponse = await estimateGasObj.perform()
    , gasToUse = estimateGasResponse.data.gas_to_use
  ;

  if (inAsync) {
    return contractInteractHelper.sendTxAsyncFromAddr(
      web3Provider,
      this.contractAddress,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {
        gasPrice: gasPrice,
        gas: gasToUse
      }
    );
  } else {
    return contractInteractHelper.safeSendFromAddr(
      web3Provider,
      this.contractAddress,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {
        gasPrice: gasPrice,
        gas: gasToUse
      }
    );
  }
};

module.exports = UtilityRegistrarKlass;
