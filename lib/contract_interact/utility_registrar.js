"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on Registrar Contract on Utility Chain.<br><br>
 *
 *   Prerequisite:
 *    <ol>
 *       <li>Registrar Contract has been deployed on Utility Chain</li>
 *     </ol>
 *
 * @module lib/contract_interact/utility_registrar
 *
 */

const rootPrefix = "../.."
  , web3RpcProvider = require(rootPrefix+"/lib/web3/providers/utility_rpc")
  , responseHelper  = require( rootPrefix + '/lib/formatter/response' )
  , helper = require("./helper")
  , contractName = 'utilityRegistrar'
  , coreConstants = require(rootPrefix+"/config/core_constants")
  , coreAddresses = require(rootPrefix+"/config/core_addresses")
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract( contractAbi )
  , OpsMangedContract = require("./ops_managed_contract")

  , UC_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE
  , MAX_UC_GAS   = 10000000
;

currContract.setProvider( web3RpcProvider.currentProvider );

/**
 * @constructor
 * @augments OpsMangedContract
 *
 * @param {String} contractAddress - address where Contract has been deployed
 *
 */
const UtilityRegistrar = module.exports = function (contractAddress) {
  this.contractAddress = contractAddress;
  OpsMangedContract.call(this, contractAddress, web3RpcProvider, currContract, UC_GAS_PRICE)
  currContract.options.address = contractAddress;
  currContract.setProvider( web3RpcProvider.currentProvider );
};

UtilityRegistrar.prototype = Object.create(OpsMangedContract.prototype);

UtilityRegistrar.prototype.constructor = UtilityRegistrar;

/**
 * Register Branded Token
 *
 * @param {String} senderAddress - address which sent register BT request
 * @param {String} senderPassphrase - passphrase of senderAddress
 * @param {String} registry - address of OpenSTUtility registry
 * @param {String} symbol - member company symbol
 * @param {String} name -  member company name
 * @param {String} conversionRate -  member company conversation rate wrt ST
 * @param {String} requester - address of requester
 * @param {String} brandedToken - ERC20 address of BT
 * @param {String} checkUuid - UUID for validating transaction
 *
 * @return {Promise}
 *
 */
UtilityRegistrar.prototype.registerBrandedToken = async function(senderAddress, senderPassphrase, registry, symbol,
                                                                 name, conversionRate, requester,
                                                                 brandedToken, checkUuid) {
    //Calculate gas required for proposing branded token.
    const gasToUse = await currContract.methods
      .registerBrandedToken(registry, symbol, name, 
        conversionRate,  requester, 
        brandedToken, checkUuid)
          .estimateGas({
            from: senderAddress,
            gasPrice: UC_GAS_PRICE
          });

    console.log( "registerBrandedToken inputs"
      , "gasToUse", gasToUse
      , "registry", registry
      , "symbol", symbol
      , "name", name
      , "conversionRate", conversionRate
      , "requester", requester
      , "brandedToken", brandedToken
      , "checkUuid", checkUuid
    );

    if ( Number( gasToUse ) === Number( MAX_UC_GAS ) ) {
      return Promise.resolve( responseHelper.error('ci_ur_1', 'Something went wrong') );
    }

    const encodedABI = currContract.methods.registerBrandedToken(registry, symbol, name, conversionRate, requester, brandedToken, checkUuid).encodeABI();
    const transactionReceiptResult = await helper.safeSendFromAddr(
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

    return Promise.resolve(transactionReceiptResult);

};

/**
 * Confirm Staking Intent
 *
 * @param {String} senderAddress - address which sent register BT request
 * @param {String} senderPassphrase - passphrase of senderAddress
 * @param {String} registryContractAddr - registry Contract Addrress
 * @param {String} uuid - UUID for validating transaction
 * @param {String} stakerAddr - staker Address
 * @param {String} stakerNonce -  staker nonce
 * @param {String} beneficiary -  beneficiary address
 * @param {String} amountST - amount of ST being staked
 * @param {String} amountUT - amount of BT being minted
 * @param {Number} stakingUnlockHeight -
 * @param {String} stakingIntentHash -
 *
 * @return {Promise}
 *
 */
UtilityRegistrar.prototype.confirmStakingIntent = async function(
  senderAddress,
  senderPassphrase,
  registryContractAddr,
  uuid,
  stakerAddr,
  stakerNonce,
  beneficiary,
  amountST,
  amountUT,
  stakingUnlockHeight,
  stakingIntentHash
) {

  const encodedABI = currContract.methods.confirmStakingIntent(
    registryContractAddr,
    uuid,
    stakerAddr,
    stakerNonce,
    beneficiary,
    amountST,
    amountUT,
    stakingUnlockHeight,
    stakingIntentHash
  ).encodeABI();

  const transactionReceiptResult = await helper.safeSendFromAddr(
    web3RpcProvider,
    this.contractAddress,
    encodedABI,
    senderAddress,
    senderPassphrase,
    {
      gasPrice: UC_GAS_PRICE,
      gas: 10000000
    }
  );

  console.log(transactionReceiptResult);

  return Promise.resolve(transactionReceiptResult);

};
