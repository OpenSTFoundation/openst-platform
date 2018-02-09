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
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , OpsManagedKlass = require(rootPrefix + '/lib/contract_interact/ops_managed')
;

const utilityRegistrarContractName = 'utilityRegistrar'
  , utilityRegistrarContractAbi = coreAddresses.getAbiForContract(utilityRegistrarContractName)
  , utilityRegistrarContractObj = new web3RpcProvider.eth.Contract(utilityRegistrarContractAbi)
  , UC_GAS_LIMT = coreConstants.OST_UTILITY_GAS_LIMIT
  , UC_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE
;

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
  const oThis = this;

  oThis.contractAddress = contractAddress;

  utilityRegistrarContractObj.options.address = oThis.contractAddress;
  utilityRegistrarContractObj.setProvider(web3RpcProvider.currentProvider);

  OpsManagedKlass.call(oThis, oThis.contractAddress, web3RpcProvider, utilityRegistrarContractObj, UC_GAS_PRICE);
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
 * @param {string} requester - address of requester
 * @param {string} brandedToken - ERC20 address of BT
 * @param {string} checkUuid - UUID for validating transaction
 *
 * @return {promise<result>}
 *
 */
UtilityRegistrarKlass.prototype.registerBrandedToken = async function (senderAddress, senderPassphrase, registry, symbol,
              name, conversionRate, requester, brandedToken, checkUuid) {
  //Calculate gas required for proposing branded token.
  const gasToUse = await utilityRegistrarContractObj.methods.registerBrandedToken(registry, symbol, name,
    conversionRate, requester, brandedToken, checkUuid)
    .estimateGas({
      from: senderAddress,
      gasPrice: UC_GAS_PRICE,
      gas: UC_GAS_LIMT
    });

  if (Number(gasToUse) === Number(UC_GAS_LIMT)) {
    return Promise.resolve(responseHelper.error('l_ci_ur_registerBrandedToken_1', 'Something went wrong'));
  }

  const encodedABI = utilityRegistrarContractObj.methods.registerBrandedToken(registry, symbol, name, conversionRate,
    requester, brandedToken, checkUuid).encodeABI();
  return contractInteractHelper.safeSendFromAddr(
    web3RpcProvider,
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
 *
 * @return {promise<result>}
 *
 */
UtilityRegistrarKlass.prototype.confirmStakingIntent = async function (senderAddress, senderPassphrase, registryContractAddr,
               uuid, stakerAddr, stakerNonce, beneficiary, amountST, amountUT, stakingUnlockHeight, stakingIntentHash)
{
  const encodedABI = utilityRegistrarContractObj.methods.confirmStakingIntent(registryContractAddr, uuid, stakerAddr,
    stakerNonce, beneficiary, amountST, amountUT, stakingUnlockHeight, stakingIntentHash).encodeABI();

  const currentGasPrice = new BigNumber(await web3RpcProvider.eth.getGasPrice())
  ;

  return contractInteractHelper.safeSendFromAddr(
    web3RpcProvider,
    this.contractAddress,
    encodedABI,
    senderAddress,
    senderPassphrase,
    {
      gasPrice: (currentGasPrice.equals(0) ? '0x0' : UC_GAS_PRICE),
      gas: UC_GAS_LIMT
    }
  );
};

module.exports = UtilityRegistrarKlass;
