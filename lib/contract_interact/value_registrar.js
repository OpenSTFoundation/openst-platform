"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on Registrar Contract on Value Chain.<br><br>
 *
 *   Prerequisite:
 *    <ol>
 *       <li>Registrar Contract has been deployed on Value Chain</li>
 *     </ol>
 *
 * @module lib/contract_interact/utility_registrar
 *
 */

const rootPrefix = "../.."
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/value_rpc')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , responseHelper = require(rootPrefix + "/lib/formatter/response")
  , OpsMangedContract = require(rootPrefix + '/lib/contract_interact/ops_managed_contract')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')

const contractName = 'valueRegistrar'
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE
  , VC_GAS_LIMIT = coreConstants.OST_VALUE_GAS_LIMIT
  , currContract = new web3RpcProvider.eth.Contract(contractAbi)
;

currContract.setProvider(web3RpcProvider.currentProvider);

/**
 * @constructor
 * @augments OpsMangedContract
 *
 * @param {String} contractAddress - address where Contract has been deployed
 *
 */
const ValueRegistrar = module.exports = function (contractAddress) {

  this.contractAddress = contractAddress;

  currContract.options.address = contractAddress;
  currContract.setProvider(web3RpcProvider.currentProvider);

  OpsMangedContract.call(this, contractAddress, web3RpcProvider, currContract, VC_GAS_PRICE)

};

ValueRegistrar.prototype = Object.create(OpsMangedContract.prototype);

ValueRegistrar.prototype.constructor = ValueRegistrar;

/**
 * add Core on value chain
 *
 * @param {String} senderName - address which sent register BT request
 * @param {String} registry - address of OpenSTValue registry
 * @param {String} coreContractAddress - address where core contract is deployed
 *
 * @return {Promise}
 *
 */
ValueRegistrar.prototype.addCore = async function (senderName, registry, coreContractAddress) {

  const encodedABI = currContract.methods.addCore(registry, coreContractAddress).encodeABI();

  const transactionReceipt = await helper.safeSend(
    web3RpcProvider,
    this.contractAddress,
    encodedABI,
    senderName,
    {gasPrice: VC_GAS_PRICE}
  );

  return Promise.resolve(transactionReceipt);

};

/**
 * Register Utility Token
 *
 * @param {String} senderAddress - address which sent register BT request
 * @param {String} senderPassphrase - passphrase of senderAddress
 * @param {String} registry - address of OpenSTUtility registry
 * @param {String} symbol - member company symbol
 * @param {String} name -  member company name
 * @param {String} conversionRate -  member company conversation rate wrt ST
 * @param {String} utilityChainId - chain id of utility chain where BT transactions would reside
 * @param {String} requester - address of requester
 * @param {String} checkUuid - UUID for validating transaction
 *
 * @return {Promise}
 *
 */
ValueRegistrar.prototype.registerUtilityToken = async function (senderAddress, senderPassphrase,
                                                                registry, symbol, name, conversionRate, utilityChainId, requester, checkUuid) {

  const oThis = this;
  //Calculate gas required for proposing branded token.
  var gasToUse = await currContract.methods
    .registerUtilityToken(
      registry,
      symbol,
      name,
      conversionRate,
      utilityChainId,
      requester,
      checkUuid)
    .estimateGas({
      from: senderAddress,
      gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE
    });

  //TODO: Geth version < 1.7.1 issues with gas estimation. https://github.com/aragon/aragon-core/issues/141
  if (gasToUse < 650000) {
    gasToUse = 650000;
  }

  if (Number(gasToUse) === Number(VC_GAS_LIMIT)) {
    return Promise.resolve(responseHelper.error('ci_vr_1', 'Something went wrong'));
  }


  logger.info("\nregisterUtilityToken inputs"
    , "\n\tgasToUse", gasToUse
    , "\n\tregistry", registry
    , "\n\tsymbol", symbol
    , "\n\tname", name
    , "\n\tconversionRate", conversionRate
    , "\n\tutilityChainId", utilityChainId
    , "\n\trequester", requester
    , "\n\tcheckUuid", checkUuid
  );

  const encodedABI = currContract.methods.registerUtilityToken(
    registry,
    symbol,
    name,
    conversionRate,
    utilityChainId,
    requester,
    checkUuid).encodeABI();
  const transactionReceiptResult = await helper.safeSendFromAddr(
    web3RpcProvider,
    this.contractAddress,
    encodedABI,
    senderAddress,
    senderPassphrase,
    {
      gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE,
      gas: gasToUse
    }
  );

  return Promise.resolve(transactionReceiptResult);

};

/**
 * Confirm Register Intent
 *
 * @param {String} senderAddress - address which sent register BT request
 * @param {String} senderPassphrase - passphrase of senderAddress
 * @param {String} registryContractAddr - registry contract address
 * @param {String} uuid - UUID for validating transaction
 * @param {String} redeemerAddr - redeemer address
 * @param {String} redeemerNonce -  redeemer noonce
 * @param {String} amountUT -  amount of BT
 * @param {Number} redemptionUnlockHeight -
 * @param {String} redemptionIntentHash -
 *
 * @return {Promise}
 *
 */
ValueRegistrar.prototype.confirmRedemptionIntent = async function (senderAddress,
                                                                   senderPassphrase,
                                                                   registryContractAddr,
                                                                   uuid,
                                                                   redeemerAddr,
                                                                   redeemerNonce,
                                                                   amountUT,
                                                                   redemptionUnlockHeight,
                                                                   redemptionIntentHash) {

  const encodedABI = currContract.methods.confirmRedemptionIntent(
    registryContractAddr,
    uuid,
    redeemerAddr,
    redeemerNonce,
    amountUT,
    redemptionUnlockHeight,
    redemptionIntentHash
  ).encodeABI();

  const transactionReceiptResult = await helper.safeSendFromAddr(
    web3RpcProvider,
    this.contractAddress,
    encodedABI,
    senderAddress,
    senderPassphrase,
    {
      gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE,
      gas: VC_GAS_LIMIT
    }
  );

  logger.info(transactionReceiptResult);

  return Promise.resolve(transactionReceiptResult);

};