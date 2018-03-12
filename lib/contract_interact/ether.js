"use strict";

/**
 * Contract interaction methods for Ether related method<br><br>
 *
 * @module lib/contract_interact/ether
 *
 */

const uuid = require('uuid')
  , BigNumber = require('bignumber.js')
  , openSTNotification = require('@openstfoundation/openst-notification')
;

const rootPrefix = '../..'
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , web3RpcProvider = web3ProviderFactory.getProvider('value', 'rpc')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE
  , VC_GAS_LIMIT = 30000 //coreConstants.OST_VALUE_GAS_LIMIT
;

/**
 * Constructor to create object of EtherKlass
 *
 * @constructor
 *
 */
const EtherKlass = function () {

};

EtherKlass.prototype = {

  /**
   * Get Ether Balance of an address
   *
   * @param {string} owner - address
   *
   * @return {promise<result>}
   *
   */
  getBalanceOf: function (owner) {

    const oThis = this
    ;

    // Validate addresses
    if (!basicHelper.isAddressValid(owner)) {
      return Promise.resolve(responseHelper.error('l_ci_eth_getBalanceOf_1', `Invalid blockchain address: ${owner}`));
    }

    return web3RpcProvider.eth.getBalance(owner)
        .then(function(balance) {
          return responseHelper.successWithData({balance: balance});
        })
        .catch(function (err) {
          logger.error(err);
          return responseHelper.error('l_ci_eth_getBalanceOf_2', 'Something went wrong');
        });

  },

  /**
   * Transfer Ether on value chain
   *
   * @param {string} senderAddr - address of user who is sending amount
   * @param {string} senderPassphrase - sender address passphrase
   * @param {string} recipientAddr - address of user who is receiving amount
   * @param {BigNumber} amountInWei - amount which is being transferred
   * @param {object} options -
   * @param {string} options.tag - extra param which gets logged for transaction as transaction type
   * @param {boolean} [options.returnType] - 'uuid': return after basic validations.
   * 'txHash': return when TX Hash received. 'txReceipt': return when TX receipt received.  Default: uuid
   *
   * @return {promise<result>}
   *
   */
  transfer: async function (senderAddr, senderPassphrase, recipientAddr, amountInWei, options) {

    options = options || {};
    const oThis = this
        , txUUID = uuid.v4()
        , tag = options.tag
        , returnType = basicHelper.getReturnType(options.returnType)
        , notificationData = {
          topics: ['transfer.ether'],
          publisher: 'OST',
          message: {
            kind: '', // populate later: with every stage
            payload: {
              contract_name: '',
              contract_address: '',
              erc20_contract_address:'',
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

    //Validate addresses
    if (!basicHelper.isAddressValid(senderAddr)) {
      return Promise.resolve(responseHelper.error('l_ci_eth_transfer_1', `Invalid blockchain address: ${senderAddr}`));
    }
    if (!basicHelper.isAddressValid(recipientAddr)) {
      return Promise.resolve(responseHelper.error('l_ci_eth_transfer_2', `Invalid blockchain address: ${recipientAddr}`));
    }
    if (senderAddr.equalsIgnoreCase(recipientAddr)) {
      logger.error("eth :: transfer :: sender & recipient addresses are same");
      return Promise.resolve(responseHelper.error('l_ci_eth_transfer_3',
          `Same sender & recipient address provided. Sender: ${senderAddr} , Recipient: ${recipientAddr}`));
    }
    if (!basicHelper.isNonZeroWeiValid(amountInWei)) {
      return Promise.resolve(responseHelper.error('l_ci_eth_transfer_4', `Invalid amount: ${amountInWei}`));
    }
    if (!basicHelper.isTagValid(tag)) {
      return Promise.resolve(responseHelper.error('l_ci_eth_transfer_5', 'Invalid transaction tag'));
    }

    // Convert amount in BigNumber
    var bigNumAmount = basicHelper.convertToBigNumber(amountInWei);

    // Validate sender balance
    const senderBalanceResponse = await oThis._validateBalance(senderAddr, bigNumAmount);
    if (senderBalanceResponse.isFailure()) {
      return Promise.resolve(senderBalanceResponse);
    }

    // Perform transfer async
    const asyncTransfer = function() {

      // set txParams for firing event
      const txParams = {
        from: senderAddr,
        to: recipientAddr,
        value: bigNumAmount.toString(10),
        gasPrice: VC_GAS_PRICE,
        gas: 25000
      };

      // set params in notification data
      notificationData.message.payload.params.txParams = txParams; // one time

      // Unlock account and send transaction
      return new Promise(function (onResolve, onReject) {
        const onReceipt = function(receipt){

          // Publish event
          notificationData.message.kind = 'transaction_mined';
          openSTNotification.publishEvent.perform(notificationData);

          // send response
          if (basicHelper.isReturnTypeTxReceipt(returnType)) {
            return onResolve(responseHelper.successWithData({transaction_uuid: txUUID,
              transaction_hash: receipt.transactionHash, transaction_receipt: receipt}));
          }
        };

        web3RpcProvider.eth.personal.unlockAccount(senderAddr, senderPassphrase)
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
                      return onResolve(responseHelper.successWithData({transaction_uuid: txUUID, transaction_hash: transactionHash, transaction_receipt: {}}));
                    }
                  })
                  .on('receipt', onReceipt)
            })
            .catch(async function(reason) {
              logger.error("eth :: Transaction failed.\n\t Reason:", JSON.stringify(reason));
              const onCatchError = function() {
                // set error data in notification data
                notificationData.message.payload.error_data = reason;
                // Publish event
                notificationData.message.kind = 'transaction_error';
                openSTNotification.publishEvent.perform(notificationData);

                // send response
                return onResolve(responseHelper.error('l_ci_eth_transfer_6', 'Transaction failed'));
              };

              const isNotMinedInSomeBlocksError = reason.message.includes('not mined within');
              if (isNotMinedInSomeBlocksError) {
                // get receipt
                const res = await contractInteractHelper.getTransactionReceiptFromTrasactionHash(
                  web3RpcProvider,
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
      return Promise.resolve(responseHelper.successWithData({transaction_uuid: txUUID, transaction_hash: "", transaction_receipt: {}}));
    } else {
      return asyncTransfer();
    }

  },

  /**
   * @ignore
   *
   * @param {string} owner - address of user who is sending amount
   * @param {BigNumber} bigMinAmount - sender address passphrase
   *
   */
  _validateBalance: function (owner, bigMinAmount) {

    const oThis = this;

    return oThis.getBalanceOf(owner)
        .then(function (response) {

          if (response.isFailure()) {
            return response;
          }

          var balance = response.data.balance;
          if (typeof balance === "undefined" || isNaN(Number(balance))) {
            return responseHelper.error('l_ci_eth_validateBalance_1', 'Something went wrong');
          }

          var bigNumBalance = new BigNumber(balance);
          if (bigNumBalance.lessThan(bigMinAmount)) {
            return responseHelper.error('l_ci_eth_validateBalance_2', 'Insufficient Funds');
          }

          return responseHelper.successWithData({balance: balance, bigNumBalance: bigNumBalance});

        });
  }

};

module.exports = EtherKlass;
