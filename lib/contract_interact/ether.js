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
  , InstanceComposer = require( rootPrefix + "/instance_composer")
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;
require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/lib/contract_interact/helper');

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
        , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
        , web3Provider        = web3ProviderFactory.getProvider('value', 'ws')
    ;

    // Validate addresses
    if (!basicHelper.isAddressValid(owner)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_eth_getBalanceOf_1',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }

    return web3Provider.eth.getBalance(owner)
      .then(function (balance) {
        return responseHelper.successWithData({balance: balance});
      })
      .catch(function (err) {
        logger.error(err);
        return responseHelper.error({
          internal_error_identifier: 'l_ci_eth_getBalanceOf_2',
          api_error_identifier: 'something_went_wrong',
          error_config: basicHelper.fetchErrorConfig()
        });
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
      , web3ProviderFactory     = oThis.ic().getWeb3ProviderFactory()
      , coreConstants           = oThis.ic().getCoreConstants()
      , contractInteractHelper  = oThis.ic().getContractInteractHelper()

      , web3Provider            = web3ProviderFactory.getProvider('value', 'ws')
      , VC_GAS_PRICE            = coreConstants.OST_VALUE_GAS_PRICE

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
            erc20_contract_address: '',
            method: 'transfer',
            params: {args: [], txParams: {}}, // populate later: when Tx params created
            transaction_hash: '', // populate later: when Tx submitted
            chain_id: web3Provider.chainId,
            chain_kind: web3Provider.chainKind,
            uuid: txUUID,
            tag: tag,
            error_data: {} // populate later: when error received
          }
        }
      }
    ;

    //Validate addresses
    if (!basicHelper.isAddressValid(senderAddr)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_eth_transfer_1',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }
    if (!basicHelper.isAddressValid(recipientAddr)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_eth_transfer_2',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }
    if (senderAddr.equalsIgnoreCase(recipientAddr)) {
      logger.error("eth :: transfer :: sender & recipient addresses are same");

      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_eth_transfer_3',
        api_error_identifier: 'sender_and_recipient_same',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }
    if (!basicHelper.isNonZeroWeiValid(amountInWei)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_eth_transfer_4',
        api_error_identifier: 'invalid_amount',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }
    if (!basicHelper.isTagValid(tag)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_eth_transfer_5',
        api_error_identifier: 'invalid_transaction_tag',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }

    // Convert amount in BigNumber
    var bigNumAmount = basicHelper.convertToBigNumber(amountInWei);

    // Validate sender balance
    const senderBalanceResponse = await oThis._validateBalance(senderAddr, bigNumAmount);
    if (senderBalanceResponse.isFailure()) {
      return Promise.resolve(senderBalanceResponse);
    }

    // Perform transfer async
    const asyncTransfer = function () {

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
        const onReceipt = function (receipt) {

          // Publish event
          notificationData.message.kind = 'transaction_mined';
          openSTNotification.publishEvent.perform(notificationData);

          // send response
          if (basicHelper.isReturnTypeTxReceipt(returnType)) {
            return onResolve(responseHelper.successWithData({
              transaction_uuid: txUUID,
              transaction_hash: receipt.transactionHash, transaction_receipt: receipt
            }));
          }
        };

        web3Provider.eth.personal.unlockAccount(senderAddr, senderPassphrase)
          .then(function () {
            return web3Provider.eth.sendTransaction(txParams)
              .on('transactionHash', function (transactionHash) {

                // set transaction hash in notification data
                notificationData.message.payload.transaction_hash = transactionHash; // one time
                // Publish event
                notificationData.message.kind = 'transaction_initiated';
                openSTNotification.publishEvent.perform(notificationData);

                // send response
                if (basicHelper.isReturnTypeTxHash(returnType)) {
                  return onResolve(responseHelper.successWithData({
                    transaction_uuid: txUUID,
                    transaction_hash: transactionHash,
                    transaction_receipt: {}
                  }));
                }
              })
              .on('receipt', onReceipt)
          })
          .catch(async function (reason) {
            logger.error("eth :: Transaction failed.\n\t Reason:", reason);
            const onCatchError = function () {
              // set error data in notification data
              notificationData.message.payload.error_data = reason;
              // Publish event
              notificationData.message.kind = 'transaction_error';
              openSTNotification.publishEvent.perform(notificationData);

              // send response
              let errObj = responseHelper.error({
                internal_error_identifier: 'l_ci_eth_transfer_6',
                api_error_identifier: 'transaction_failed',
                error_config: basicHelper.fetchErrorConfig()
              });
              return onResolve(errObj);
            };

            const isNotMinedInSomeBlocksError = reason.message.includes('not mined within');
            if (isNotMinedInSomeBlocksError) {
              // get receipt
              const res = await contractInteractHelper.getTransactionReceiptFromTrasactionHash(
                web3Provider,
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
      return Promise.resolve(responseHelper.successWithData({
        transaction_uuid: txUUID,
        transaction_hash: "",
        transaction_receipt: {}
      }));
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
          return responseHelper.error({
            internal_error_identifier: 'l_ci_eth_validateBalance_1',
            api_error_identifier: 'something_went_wrong',
            error_config: basicHelper.fetchErrorConfig()
          });
        }

        var bigNumBalance = new BigNumber(balance);
        if (bigNumBalance.lessThan(bigMinAmount)) {
          return responseHelper.error({
            internal_error_identifier: 'l_ci_eth_validateBalance_2',
            api_error_identifier: 'insufficient_funds',
            error_config: basicHelper.fetchErrorConfig()
          });
        }

        return responseHelper.successWithData({balance: balance, bigNumBalance: bigNumBalance});

      });
  }

};
InstanceComposer.registerShadowableClass(EtherKlass, "getEtherInteractClass");

module.exports = EtherKlass;
