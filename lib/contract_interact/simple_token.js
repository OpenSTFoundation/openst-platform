"use strict";

/**
 *
 * Contract interaction methods for Simple Token Contract.<br><br>
 *
 * @module lib/contract_interact/simple_token
 *
 */

//All Module Requires.
const uuid = require('uuid')
    , BigNumber = require('bignumber.js')
    , openSTNotification = require('@openstfoundation/openst-notification')
;

const rootPrefix = '../..'
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/value_rpc')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , OpsManagedKlass = require(rootPrefix + '/lib/contract_interact/ops_managed')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

const simpleTokenContractName = 'simpleToken'
  , simpleTokenContractAddr = coreAddresses.getAddressForContract(simpleTokenContractName)
  , simpleTokenContractAbi = coreAddresses.getAbiForContract(simpleTokenContractName)
  , simpleTokenContractObj = new web3RpcProvider.eth.Contract(simpleTokenContractAbi)
  , VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE
  , VC_GAS_LIMIT = coreConstants.OST_VALUE_GAS_LIMIT
;

/**
 * Constructor for SimpleToken Contract Interact
 *
 * @constructor
 * @augments OpsManagedKlass
 */
const SimpleTokenKlass = function() {
  this.contractAddress = simpleTokenContractAddr;
  simpleTokenContractObj.options.address = this.contractAddress;
  simpleTokenContractObj.setProvider(web3RpcProvider.currentProvider);

  OpsManagedKlass.call(this, this.contractAddress, web3RpcProvider, simpleTokenContractObj, VC_GAS_PRICE);
};

// adding the methods from OpsManged Contract
SimpleTokenKlass.prototype = Object.create(OpsManagedKlass.prototype);

SimpleTokenKlass.prototype.constructor = SimpleTokenKlass;

/**
 * Get ST balance of an address
 *
 * @param {string} address - address of which ST balance is to be fetched
 *
 * @return {promise<result>}
 *
 */
SimpleTokenKlass.prototype.balanceOf = async function (address) {

  const oThis = this;

  // validate addresses
  if (!basicHelper.isAddressValid(address)) {
    return Promise.resolve(responseHelper.error('l_ci_st_balanceOf_1', `Invalid blockchain address: ${address}`));
  }

  const callMethodResult = await oThis._callMethod('balanceOf', [address])
  , response = callMethodResult.data.balanceOf;

  return Promise.resolve(responseHelper.successWithData({balance: response[0]}));

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
SimpleTokenKlass.prototype.allowance = async function (ownerAddress, spenderAddress) {
  const oThis = this
    , callMethodResult = await oThis._callMethod('allowance', [ownerAddress, spenderAddress])
    , response = callMethodResult.data.allowance;
  return Promise.resolve(responseHelper.successWithData({remaining: response[0]}));
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
SimpleTokenKlass.prototype.approve = async function (senderAddress, senderPassphrase, spenderAddress, value, inAsync) {
  const encodedABI = simpleTokenContractObj.methods.approve(spenderAddress, value).encodeABI();

  if (inAsync) {
    return contractInteractHelper.sendTxAsyncFromAddr(
      web3RpcProvider,
      simpleTokenContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {gasPrice: coreConstants.OST_VALUE_GAS_PRICE}
    )
  } else {
    const transactionReceipt = await contractInteractHelper.safeSendFromAddr(
      web3RpcProvider,
      simpleTokenContractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {gasPrice: VC_GAS_PRICE}
    );
    return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));
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
SimpleTokenKlass.prototype.finalize = async function (senderAddress, senderPassphrase) {
  const encodedABI = simpleTokenContractObj.methods.finalize().encodeABI();

  const transactionReceipt = await contractInteractHelper.safeSendFromAddr(
    web3RpcProvider,
    simpleTokenContractAddr,
    encodedABI,
    senderAddress,
    senderPassphrase,
    {gasPrice: VC_GAS_PRICE}
  );
  return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));
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

  const oThis = this
    , scope = simpleTokenContractObj.methods
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
      return responseHelper.error('l_ci_st_callMethod_' + methodName + '_1', 'Something went wrong');
    })
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
SimpleTokenKlass.prototype.transfer = async function (senderAddress, senderPassphrase, receiverAddress, amountInWei, options) {

  options = options || {};

  const oThis = this
      , txUUID = uuid.v4()
      , tag = options.tag
      , returnType = basicHelper.getReturnType(options.returnType)
      , notificationData = {
        topics: ['transfer.st'],
        message: {
          kind: '', // populate later: with every stage
          payload: {
            contract_name: simpleTokenContractName,
            contract_address: oThis.contractAddress,
            method: 'transfer',
            params: {args: [], txParams: {}}, // populate later: when Tx params created
            transaction_hash: '', // populate later: when Tx submitted
            chain_id: web3RpcProvider.chainId,
            chain_kind: web3RpcProvider.chainKind,
            uuid: txUUID,
            tag: tag,
            error_data: {} // populate later: when error received
          }
        }
      }
  ;

  // validate addresses
  if (!basicHelper.isAddressValid(senderAddress)) {
    return Promise.resolve(responseHelper.error('l_ci_st_transfer_1', `Invalid blockchain address: ${senderAddress}`));
  }

  if (!basicHelper.isAddressValid(receiverAddress)) {
    return Promise.resolve(responseHelper.error('l_ci_st_transfer_2', `Invalid blockchain address: ${receiverAddress}`));
  }

  if (senderAddress.equalsIgnoreCase(receiverAddress)) {
    return Promise.resolve(responseHelper.error('l_ci_st_transfer_3',
        `Same sender & recipient address provided. Sender: ${senderAddress} , Recipient: ${receiverAddress}`));
  }

  if (!basicHelper.isNonZeroWeiValid(amountInWei)) {
    return Promise.resolve(responseHelper.error('l_ci_st_transfer_4', `Invalid amount: ${amountInWei}`));
  }
  if (!basicHelper.isTagValid(tag)) {
    return Promise.resolve(responseHelper.error('l_ci_st_transfer_5', 'Invalid transaction tag'));
  }

  // Convert amount in BigNumber
  var bigNumAmount = basicHelper.convertToBigNumber(amountInWei);

  // Validate sender balance
  const senderBalanceResponse = await oThis._validateBalance(senderAddress, bigNumAmount);
  if (senderBalanceResponse.isFailure()) {
    return Promise.resolve(senderBalanceResponse);
  }

  // Perform transfer async
  const asyncTransfer = function() {

    // set txParams for firing event
    const rawTxParams = {from: senderAddress, to: receiverAddress, value: bigNumAmount.toString(10),
      gasPrice: VC_GAS_PRICE, gas: VC_GAS_LIMIT}; // TODO: gas should be computed value

    // set params in notification data
    notificationData.message.payload.params.txParams = rawTxParams; // one time

    const encodedABI = simpleTokenContractObj.methods.transfer(receiverAddress, amountInWei).encodeABI();

    // set txParams for executing transaction
    const txParams = {
      from: senderAddress,
      to: oThis.contractAddress,
      data: encodedABI
    };

    // Unlock account and send transaction
    return new Promise(function (onResolve, onReject) {
      web3RpcProvider.eth.personal.unlockAccount(senderAddress, senderPassphrase)
          .then(function(){
            web3RpcProvider.eth.sendTransaction(txParams)
                .on('transactionHash', function (transactionHash) {
                  // set transaction hash in notification data
                  notificationData.message.payload.transaction_hash = transactionHash; // one time
                  // Publish event
                  notificationData.message.kind = 'transaction_initiated';
                  openSTNotification.publishEvent.perform(notificationData);

                  // send response
                  if (basicHelper.isReturnTypeTxHash(returnType)) {
                    return onResolve(responseHelper.successWithData({txUuid: txUUID, txHash: transactionHash, txReceipt: {}}));
                  }
                })
                .on('receipt', function(receipt){
                  // Publish event
                  notificationData.message.kind = 'transaction_mined';
                  openSTNotification.publishEvent.perform(notificationData);

                  // send response
                  if (basicHelper.isReturnTypeTxReceipt(returnType)) {
                    return onResolve(responseHelper.successWithData({txUuid: txUUID, txHash: receipt.transactionHash, txReceipt: receipt}));
                  }
                })
          })
          .catch(function(reason) {

            logger.error("ST :: Transaction failed.\n\t Reason:", JSON.stringify(reason));

            // set error data in notification data
            notificationData.message.payload.error_data = reason;
            // Publish event
            notificationData.message.kind = 'error';
            openSTNotification.publishEvent.perform(notificationData);

            // send response
            return onResolve(responseHelper.error('l_ci_st_transfer_6', `Transaction failed`));

          });

    });

  };

  // Perform transaction as requested
  if (basicHelper.isReturnTypeUUID(returnType)) {
    asyncTransfer();
    return Promise.resolve(responseHelper.successWithData({txUuid: txUUID, txHash: "", txReceipt: {}}));
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
SimpleTokenKlass.prototype._validateBalance = function (owner, bigMinAmount) {

  const oThis = this;

  return oThis.balanceOf(owner)
      .then(function (response) {

        if (response.isFailure()) {
          return response;
        }

        var balance = response.data.balance;
        if (typeof balance === "undefined" || isNaN(Number(balance))) {
          return responseHelper.error('l_ci_st_validateBalance_1', 'Something went wrong');
        }

        var bigNumBalance = new BigNumber(balance);
        if (bigNumBalance.lessThan(bigMinAmount)) {
          return responseHelper.error('l_ci_st_validateBalance_2', 'Insufficient Funds');
        }

        return responseHelper.successWithData({balance: balance, bigNumBalance: bigNumBalance});

      });
};

module.exports = new SimpleTokenKlass();