'use strict';

/**
 *
 * Contract interaction methods for Simple Token Contract.<br><br>
 *
 * @module lib/contract_interact/simple_token
 *
 */

//All Module Requires.
const uuid = require('uuid'),
  BigNumber = require('bignumber.js'),
  openSTNotification = require('@openstfoundation/openst-notification');

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  /**
   Note: OpsManagedKlass is a special case here. OpsManagedKlass is derived from it.
   Hence, dont worry, you dont need to use oThis.ic().getOwnedInteractClass()
   **/
  OpsManagedKlass = require(rootPrefix + '/lib/contract_interact/ops_managed'),
  basicHelper = require(rootPrefix + '/helpers/basic_helper');

require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/lib/contract_interact/helper');
require(rootPrefix + '/services/transaction/estimate_gas');

const simpleTokenContractName = 'simpleToken';

var simpleTokenContractObj = null;
/**
 * Constructor for SimpleToken Contract Interact
 *
 * @constructor
 * @augments OpsManagedKlass
 */
const SimpleTokenKlass = function() {
  const oThis = this,
    coreAddresses = oThis.ic().getCoreAddresses(),
    coreConstants = oThis.ic().getCoreConstants(),
    web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
    web3Provider = web3ProviderFactory.getProvider('value', 'ws'),
    simpleTokenContractAddr = coreAddresses.getAddressForContract(simpleTokenContractName),
    simpleTokenContractAbi = coreAddresses.getAbiForContract(simpleTokenContractName),
    simpleTokenContractObj = new web3Provider.eth.Contract(simpleTokenContractAbi);

  oThis.contractAddress = simpleTokenContractAddr;
  oThis.simpleTokenContractObj = simpleTokenContractObj;
  oThis.VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE;
  oThis.VC_GAS_LIMIT = coreConstants.OST_VALUE_GAS_LIMIT;

  simpleTokenContractObj.options.address = oThis.contractAddress;

  OpsManagedKlass.call(oThis, oThis.contractAddress, web3Provider, simpleTokenContractObj, oThis.VC_GAS_PRICE);
};

// adding the methods from OpsManged Contract
SimpleTokenKlass.prototype = Object.create(OpsManagedKlass.prototype);
SimpleTokenKlass.prototype.simpleTokenContractObj = null;
SimpleTokenKlass.prototype.VC_GAS_PRICE = null;
SimpleTokenKlass.prototype.VC_GAS_LIMIT = null;

SimpleTokenKlass.prototype.constructor = SimpleTokenKlass;

/**
 * Get ST balance of an address
 *
 * @param {string} address - address of which ST balance is to be fetched
 *
 * @return {promise<result>}
 *
 */
SimpleTokenKlass.prototype.balanceOf = async function(address) {
  const oThis = this;

  // validate addresses
  if (!basicHelper.isAddressValid(address)) {
    let errObj = responseHelper.error({
      internal_error_identifier: 'l_ci_st_balanceOf_1',
      api_error_identifier: 'invalid_address',
      error_config: basicHelper.fetchErrorConfig()
    });

    return Promise.resolve(errObj);
  }

  const callMethodResult = await oThis._callMethod('balanceOf', [address]),
    response = callMethodResult.data.balanceOf;

  return Promise.resolve(responseHelper.successWithData({ balance: response[0] }));
};

/**
 * Method by which we can find how much of autorized value by ownerAddress is unspent by spenderAddress
 *
 * @param {string} ownerAddress - address which authorized spenderAddress to spend value
 * @param {string} spenderAddress - address which was authorized to spend value
 *
 * @return {promise<result>}
 *
 */
SimpleTokenKlass.prototype.allowance = async function(ownerAddress, spenderAddress) {
  const oThis = this,
    callMethodResult = await oThis._callMethod('allowance', [ownerAddress, spenderAddress]),
    response = callMethodResult.data.allowance;
  return Promise.resolve(responseHelper.successWithData({ remaining: response[0] }));
};

/**
 * Approve spender on behalf of sender to spend amount equal to value ST.
 *
 * @param {string} senderAddress - address which authorizes spenderAddress to spend value
 * @param {string} senderPassphrase - passphrase of sender address
 * @param {string} spenderAddress - address which is authorized to spend value
 * @param {number} value - value
 * @param {boolean} inAsync - true of one wants only the transaction hash and not wait till the mining
 *
 * @return {promise}
 *
 */
SimpleTokenKlass.prototype.approve = async function(senderAddress, senderPassphrase, spenderAddress, value, inAsync) {
  const oThis = this,
    coreAddresses = oThis.ic().getCoreAddresses(),
    simpleTokenContractAddr = coreAddresses.getAddressForContract(simpleTokenContractName),
    web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
    web3Provider = web3ProviderFactory.getProvider('value', 'ws'),
    EstimateGasKlass = oThis.ic().getEstimateGasService(),
    contractInteractHelper = oThis.ic().getContractInteractHelper();

  const encodedABI = oThis.simpleTokenContractObj.methods.approve(spenderAddress, value).encodeABI();

  const estimateGasObj = new EstimateGasKlass({
    contract_name: simpleTokenContractName,
    contract_address: oThis.contractAddress,
    chain: 'value',
    sender_address: senderAddress,
    method_name: 'approve',
    method_arguments: [spenderAddress, value]
  });

  const estimateGasResponse = await estimateGasObj.perform(),
    gasToUse = estimateGasResponse.data.gas_to_use,
    txParams = { gasPrice: oThis.VC_GAS_PRICE, gas: gasToUse };

  if (inAsync) {
    const transactionHash = await contractInteractHelper.sendTxAsyncFromAddr(
      web3Provider,
      simpleTokenContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      txParams
    );
    return Promise.resolve(responseHelper.successWithData({ transaction_hash: transactionHash }));
  } else {
    const transactionReceiptRsp = await contractInteractHelper.safeSendFromAddr(
      web3Provider,
      simpleTokenContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      txParams
    );
    return Promise.resolve(transactionReceiptRsp);
  }
};

/**
 * Finalize
 *
 * @param {string} senderAddress - address which authorizes finalize
 * @param {string} senderPassphrase - passphrase of sender address
 *
 * @return {promise<result>}
 *
 */
SimpleTokenKlass.prototype.finalize = async function(senderAddress, senderPassphrase) {
  const oThis = this,
    coreAddresses = oThis.ic().getCoreAddresses(),
    simpleTokenContractAddr = coreAddresses.getAddressForContract(simpleTokenContractName),
    web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
    web3Provider = web3ProviderFactory.getProvider('value', 'ws'),
    contractInteractHelper = oThis.ic().getContractInteractHelper();

  const encodedABI = oThis.simpleTokenContractObj.methods.finalize().encodeABI();

  const transactionReceipt = await contractInteractHelper.safeSendFromAddr(
    web3Provider,
    simpleTokenContractAddr,
    encodedABI,
    senderAddress,
    senderPassphrase,
    { gasPrice: oThis.VC_GAS_PRICE, gas: oThis.VC_GAS_LIMIT }
  );
  return Promise.resolve(responseHelper.successWithData({ transactionReceipt: transactionReceipt }));
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
SimpleTokenKlass.prototype._callMethod = function(methodName, args) {
  const oThis = this,
    web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
    web3Provider = web3ProviderFactory.getProvider('value', 'ws'),
    contractInteractHelper = oThis.ic().getContractInteractHelper(),
    scope = oThis.simpleTokenContractObj.methods,
    transactionObject = scope[methodName].apply(scope, args || []),
    encodeABI = transactionObject.encodeABI(),
    transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject),
    resultData = {};

  return contractInteractHelper
    .call(web3Provider, oThis.contractAddress, encodeABI, {}, transactionOutputs)
    .then(function(decodedResponse) {
      // process response and generate array using numbered keys
      const numberKeys = Array(decodedResponse['__length__'])
          .fill()
          .map((_, i) => i.toString()),
        processedResponse = [];
      for (var key in numberKeys) {
        processedResponse.push(decodedResponse[key]);
      }
      return processedResponse;
    })
    .then(function(response) {
      resultData[methodName] = response;
      return responseHelper.successWithData(resultData);
    })
    .catch(function(err) {
      logger.error(err);
      return responseHelper.error({
        internal_error_identifier: 'l_ci_st_callMethod_' + methodName + '_1',
        api_error_identifier: 'something_went_wrong',
        error_config: basicHelper.fetchErrorConfig()
      });
    });
};

/**
 * Transfer ost from sender address to receiver address
 *
 * @param {string} senderAddress - address which sends OST
 * @param {string} senderPassphrase - passphrase of sender address
 * @param {string} receiverAddress - address which would recieve OST
 * @param {number} amountInWei - OST to transfer in Weis
 * @param {object} options -
 * @param {string} options.tag - extra param which gets logged for transaction as transaction type
 * @param {boolean} [options.returnType] - 'uuid': return after basic validations.
 * 'txHash': return when TX Hash received. 'txReceipt': return when TX receipt received.  Default: uuid
 *
 * @return {promise}
 *
 */
SimpleTokenKlass.prototype.transfer = async function(
  senderAddress,
  senderPassphrase,
  receiverAddress,
  amountInWei,
  options
) {
  options = options || {};

  const oThis = this,
    web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
    web3Provider = web3ProviderFactory.getProvider('value', 'ws'),
    EstimateGasKlass = oThis.ic().getEstimateGasService(),
    contractInteractHelper = oThis.ic().getContractInteractHelper(),
    txUUID = uuid.v4(),
    tag = options.tag,
    returnType = basicHelper.getReturnType(options.returnType),
    notificationData = {
      topics: ['transfer.st'],
      publisher: 'OST',
      message: {
        kind: '', // populate later: with every stage
        payload: {
          contract_name: simpleTokenContractName,
          contract_address: oThis.contractAddress,
          erc20_contract_address: oThis.contractAddress,
          method: 'transfer',
          params: { args: [], txParams: {} }, // populate later: when Tx params created
          transaction_hash: '', // populate later: when Tx submitted
          chain_id: web3Provider.chainId,
          chain_kind: web3Provider.chainKind,
          uuid: txUUID,
          tag: tag,
          error_data: {} // populate later: when error received
        }
      }
    };

  // validate addresses
  if (!basicHelper.isAddressValid(senderAddress)) {
    let errObj = responseHelper.error({
      internal_error_identifier: 'l_ci_st_transfer_1',
      api_error_identifier: 'invalid_address',
      error_config: basicHelper.fetchErrorConfig()
    });
    return Promise.resolve(errObj);
  }

  if (!basicHelper.isAddressValid(receiverAddress)) {
    let errObj = responseHelper.error({
      internal_error_identifier: 'l_ci_st_transfer_2',
      api_error_identifier: 'invalid_address',
      error_config: basicHelper.fetchErrorConfig()
    });
    return Promise.resolve(errObj);
  }

  if (senderAddress.equalsIgnoreCase(receiverAddress)) {
    let errObj = responseHelper.error({
      internal_error_identifier: 'l_ci_st_transfer_3',
      api_error_identifier: 'sender_and_recipient_same',
      error_config: basicHelper.fetchErrorConfig()
    });
    return Promise.resolve(errObj);
  }

  if (!basicHelper.isNonZeroWeiValid(amountInWei)) {
    let errObj = responseHelper.error({
      internal_error_identifier: 'l_ci_st_transfer_4',
      api_error_identifier: 'invalid_amount',
      error_config: basicHelper.fetchErrorConfig()
    });
    return Promise.resolve(errObj);
  }
  if (!basicHelper.isTagValid(tag)) {
    let errObj = responseHelper.error({
      internal_error_identifier: 'l_ci_st_transfer_5',
      api_error_identifier: 'invalid_transaction_tag',
      error_config: basicHelper.fetchErrorConfig()
    });
    return Promise.resolve(errObj);
  }

  // Convert amount in BigNumber
  var bigNumAmount = basicHelper.convertToBigNumber(amountInWei);

  // Validate sender balance
  const senderBalanceResponse = await oThis._validateBalance(senderAddress, bigNumAmount);
  if (senderBalanceResponse.isFailure()) {
    return Promise.resolve(senderBalanceResponse);
  }

  // Perform transfer async
  const asyncTransfer = async function() {
    const encodedABI = oThis.simpleTokenContractObj.methods
      .transfer(receiverAddress, bigNumAmount.toString(10))
      .encodeABI();

    const estimateGasObj = new EstimateGasKlass({
      contract_name: simpleTokenContractName,
      contract_address: oThis.contractAddress,
      chain: 'value',
      sender_address: senderAddress,
      method_name: 'transfer',
      method_arguments: [receiverAddress, bigNumAmount.toString(10)]
    });

    const estimateGasResponse = await estimateGasObj.perform(),
      gasToUse = estimateGasResponse.data.gas_to_use;

    // set txParams for firing event
    const rawTxParams = {
      from: senderAddress,
      to: receiverAddress,
      value: bigNumAmount.toString(10),
      gasPrice: oThis.VC_GAS_PRICE,
      gas: gasToUse
    };

    // set params in notification data
    notificationData.message.payload.params.txParams = rawTxParams; // one time

    // set txParams for executing transaction
    const txParams = {
      from: senderAddress,
      to: oThis.contractAddress,
      data: encodedABI,
      gasPrice: oThis.VC_GAS_PRICE,
      gas: gasToUse
    };

    // Unlock account and send transaction
    return new Promise(function(onResolve, onReject) {
      const onReceipt = function(receipt) {
        // Publish event
        notificationData.message.kind = 'transaction_mined';
        openSTNotification.publishEvent.perform(notificationData);

        // send response
        if (basicHelper.isReturnTypeTxReceipt(returnType)) {
          return onResolve(
            responseHelper.successWithData({
              transaction_uuid: txUUID,
              transaction_hash: receipt.transactionHash,
              transaction_receipt: receipt
            })
          );
        }
      };

      web3ProviderFactory
        .getProvider('value', 'ws')
        .eth.personal.unlockAccount(senderAddress, senderPassphrase)
        .then(function() {
          return web3ProviderFactory
            .getProvider('value', 'ws')
            .eth.sendTransaction(txParams)
            .on('transactionHash', function(transactionHash) {
              // set transaction hash in notification data
              notificationData.message.payload.transaction_hash = transactionHash; // one time
              // Publish event
              notificationData.message.kind = 'transaction_initiated';
              openSTNotification.publishEvent.perform(notificationData);

              // send response
              if (basicHelper.isReturnTypeTxHash(returnType)) {
                return onResolve(
                  responseHelper.successWithData({
                    transaction_uuid: txUUID,
                    transaction_hash: transactionHash,
                    transaction_receipt: {}
                  })
                );
              }
            })
            .on('receipt', onReceipt);
        })
        .catch(async function(reason) {
          logger.error('ST :: Transaction failed.\n\t Reason:', reason);

          const onCatchError = function() {
            // set error data in notification data
            notificationData.message.payload.error_data = reason;
            // Publish event
            notificationData.message.kind = 'transaction_error';
            openSTNotification.publishEvent.perform(notificationData);

            // send response
            let errObj = responseHelper.error({
              internal_error_identifier: 'l_ci_st_transfer_6',
              api_error_identifier: 'transaction_failed',
              error_config: basicHelper.fetchErrorConfig()
            });
            return onResolve(errObj);
          };

          const isNotMinedInSomeBlocksError = reason.message.includes('not mined within');
          if (isNotMinedInSomeBlocksError) {
            // get receipt
            const res = await contractInteractHelper.getTransactionReceiptFromTrasactionHash(
              web3ProviderFactory.getProvider('value', 'ws'),
              notificationData.message.payload.transaction_hash
            );

            if (res.isSuccess()) {
              onReceipt(res.data.receipt);
            } else {
              onCatchError();
            }
          } else {
            onCatchError();
          }
        });
    });
  };

  // Perform transaction as requested
  if (basicHelper.isReturnTypeUUID(returnType)) {
    asyncTransfer();
    return Promise.resolve(
      responseHelper.successWithData({
        transaction_uuid: txUUID,
        transaction_hash: '',
        transaction_receipt: {}
      })
    );
  } else {
    return asyncTransfer();
  }
};

/**
 * Check if owner has required balance (i.e. bigMinAmount)
 *
 * @param {string} owner - Account address
 * @param {BigNumber} bigMinAmount - minimum required balance in big number
 *
 * @return {promise<result>}
 *
 * @ignore
 */
SimpleTokenKlass.prototype._validateBalance = function(owner, bigMinAmount) {
  const oThis = this;

  return oThis.balanceOf(owner).then(function(response) {
    if (response.isFailure()) {
      return response;
    }

    let balance = response.data.balance;
    if (typeof balance === 'undefined' || isNaN(Number(balance))) {
      return responseHelper.error({
        internal_error_identifier: 'l_ci_st_validateBalance_1',
        api_error_identifier: 'something_went_wrong',
        error_config: basicHelper.fetchErrorConfig()
      });
    }

    let bigNumBalance = new BigNumber(balance);
    if (bigNumBalance.lessThan(bigMinAmount)) {
      return responseHelper.error({
        internal_error_identifier: 'l_ci_st_validateBalance_2',
        api_error_identifier: 'insufficient_funds',
        error_config: basicHelper.fetchErrorConfig()
      });
    }

    return responseHelper.successWithData({ balance: balance, bigNumBalance: bigNumBalance });
  });
};

InstanceComposer.registerShadowableClass(SimpleTokenKlass, 'getSimpleTokenInteractClass');

module.exports = SimpleTokenKlass;
