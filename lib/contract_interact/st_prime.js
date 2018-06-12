"use strict";

/**
 *
 * Contract interaction methods for ST Prime Contract.<br><br>
 *
 * @module lib/contract_interact/st_prime
 *
 */

//All Module Requires.
const uuid = require('uuid')
  , BigNumber = require('bignumber.js')
  , openSTNotification = require('@openstfoundation/openst-notification')
;

//All other requires.
const rootPrefix = '../..'
  , web3Provider = require(rootPrefix + '/lib/web3/providers/utility_ws')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , EstimateGasKlass = require(rootPrefix + '/services/transaction/estimate_gas')
;

// All other constants
const stPrimeContractName = 'stPrime'
  , UC_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE
  , UC_GAS_LIMIT = coreConstants.OST_UTILITY_GAS_LIMIT
  , stPrimeContractAbi = coreAddresses.getAbiForContract(stPrimeContractName)
  , stPrimeContractObj = new web3Provider.eth.Contract(stPrimeContractAbi)
;

/**
 * is equal ignoring case
 *
 * @param {string} compareWith - string to compare with
 *
 * @return {booelan} true when equal
 */
String.prototype.equalsIgnoreCase = function (compareWith) {
  const oThis = this
    , _self = this.toLowerCase()
    , _compareWith = String(compareWith).toLowerCase();

  return _self === _compareWith;
};

/**
 * Constructor for ST Prime Contract Interact
 *
 * @constructor
 *
 * @param {string} contractAddress - address where Contract has been deployed
 *
 */
const StPrimeKlass = function (contractAddress) {
  this.contractAddress = contractAddress;

  if (this.contractAddress) {
    stPrimeContractObj.options.address = this.contractAddress;
  }

  //stPrimeContractObj.setProvider(web3Provider.currentProvider);

  this.currContract = stPrimeContractObj;
};

StPrimeKlass.prototype = {
  /**
   * Get branded token UUID
   *
   * @return {promise<result>}
   *
   */
  getUuid: async function () {
    const oThis = this
      , callMethodResult = await oThis._callMethod('uuid')
      , response = callMethodResult.data.uuid;
    return response[0];
  },

  /**
   * Get ST Prime Balance of an address
   *
   * @param {string} owner - address
   *
   * @return {promise<result>}
   *
   */
  getBalanceOf: function (owner) {
    const oThis = this
    ;

    return new Promise(function (onResolve, onReject) {
      // Validate addresses
      if (!basicHelper.isAddressValid(owner)) {
        let errObj = responseHelper.error({
          internal_error_identifier: 'l_ci_stp_getBalanceOf_1',
          api_error_identifier: 'invalid_address',
          error_config: basicHelper.fetchErrorConfig()
        });
        return onResolve(errObj);
      }

      web3Provider.eth.getBalance(owner).then(function (balanceFromChain) {
        return onResolve(responseHelper.successWithData({balance: balanceFromChain}));
      });
    });

  },

  /**
   * Initial Transfer of ST Prime while chain setup
   *
   * @param {string} senderName - address who is initializing this transfer - named managed key
   * @param {object} customOptions - custom params for this transaction
   *
   * @return {promise<result>}
   *
   */
  initialTransferToContract: async function (senderName, customOptions) {
    const oThis = this
      , encodedABI = stPrimeContractObj.methods.initialize().encodeABI()
      , stPrimeTotalSupplyInWei = web3Provider.utils.toWei(coreConstants.OST_UTILITY_STPRIME_TOTAL_SUPPLY, "ether");

    var options = {gasPrice: UC_GAS_PRICE, value: stPrimeTotalSupplyInWei, gas: UC_GAS_LIMIT};

    Object.assign(options, customOptions);

    return contractInteractHelper.safeSend(
      web3Provider,
      oThis.contractAddress,
      encodedABI,
      senderName,
      options
    );
  },

  /**
   * Claim ST' for beneficiary after they are process-minted
   *
   * @param {string} senderAddress - address of sender
   * @param {string} senderPassphrase - passphrase of senderAddress
   * @param {string} beneficiaryAddress - address where funds would be credited
   *
   * @return {promise<result>}
   */
  claim: async function (senderAddress, senderPassphrase, beneficiaryAddress) {
    const oThis = this
      , encodedABI = oThis.currContract.methods.claim(beneficiaryAddress).encodeABI()
      , currentGasPrice = new BigNumber(await web3Provider.eth.getGasPrice())
    ;

    const estimateGasObj = new EstimateGasKlass({
      contract_name: stPrimeContractName,
      contract_address: oThis.contractAddress,
      chain: 'utility',
      sender_address: senderAddress,
      method_name: 'claim',
      method_arguments: [beneficiaryAddress]
    });

    const estimateGasResponse = await estimateGasObj.perform()
      , gasToUse = estimateGasResponse.data.gas_to_use
    ;

    return contractInteractHelper.safeSendFromAddr(
      web3Provider,
      oThis.contractAddress,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {
        gasPrice: (currentGasPrice.equals(0) ? '0x0' : UC_GAS_PRICE),
        gas: gasToUse
      }
    );
  },

  /**
   * Transfer ST Prime
   *
   * @param {string} senderAddr - address of user who is sending amount
   * @param {string} senderPassphrase - sender address passphrase
   * @param {string} recipient - address of user who is receiving amount
   * @param {BigNumber} amountInWei - amount which is being transferred
   * @param {object} options -
   * @param {string} options.tag - extra param which gets logged for transaction as transaction type
   * @param {boolean} [options.returnType] - 'uuid': return after basic validations.
   * 'txHash': return when TX Hash received. 'txReceipt': return when TX receipt received.  Default: uuid
   *
   * @return {promise<result>}
   *
   */
  transfer: async function (senderAddr, senderPassphrase, recipient, amountInWei, options) {
    options = options || {};
    const oThis = this
      , txUUID = uuid.v4()
      , tag = options.tag
      , returnType = basicHelper.getReturnType(options.returnType)
      , notificationData = {
        topics: ['transfer.st_prime'],
        publisher: 'OST',
        message: {
          kind: '', // populate later: with every stage
          payload: {
            contract_name: stPrimeContractName,
            contract_address: oThis.contractAddress,
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

    //logger.step("STPrime :: transfer initiated"); //DEBUG

    // validate addresses
    if (!basicHelper.isAddressValid(senderAddr)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_stp_transfer_1',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }
    if (!basicHelper.isAddressValid(recipient)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_stp_transfer_2',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }
    if (senderAddr.equalsIgnoreCase(recipient)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_stp_transfer_3',
        api_error_identifier: 'sender_and_recipient_same',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }
    if (!basicHelper.isNonZeroWeiValid(amountInWei)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_stp_transfer_4',
        api_error_identifier: 'invalid_amount',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }
    if (!basicHelper.isTagValid(tag)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_stp_transfer_5',
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
      var transfer_gas_limit = 25000;
      const txParams = {
        from: senderAddr, to: recipient, value: bigNumAmount.toString(10),
        gasPrice: UC_GAS_PRICE, gas: transfer_gas_limit
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
              transaction_hash: receipt.transactionHash,
              transaction_receipt: receipt
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
            logger.error("STPrime :: Transaction failed. Rollback balance in cache.\n\t Reason:", JSON.stringify(reason));

            const onCatchError = function () {

              // set error data in notification data
              notificationData.message.payload.error_data = reason;
              // Publish event
              notificationData.message.kind = 'transaction_error';
              openSTNotification.publishEvent.perform(notificationData);

              // send response
              let errObj = responseHelper.error({
                internal_error_identifier: 'l_ci_bt_transfer_6',
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
   * Call methods of the contract which don't change the state
   *
   * @param {string} methodName - Contract method name
   * @param {array} args - method arguments
   *
   * @return {promise<result>}
   * @ignore
   *
   */
  _callMethod: function (methodName, args) {
    const oThis = this
      , scope = oThis.currContract.methods
      , transactionObject = scope[methodName].apply(scope, (args || []))
      , encodeABI = transactionObject.encodeABI()
      , transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject)
      , resultData = {};

    return contractInteractHelper.call(web3Provider, oThis.contractAddress, encodeABI, {}, transactionOutputs)
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
        return responseHelper.error({
          internal_error_identifier: 'l_ci_stp_callMethod_' + methodName + '_1',
          api_error_identifier: 'something_went_wrong',
          error_config: basicHelper.fetchErrorConfig()
        });
      })
  },

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
            internal_error_identifier: 'l_ci_stp_validateBalance_1',
            api_error_identifier: 'something_went_wrong',
            error_config: basicHelper.fetchErrorConfig()
          });
        }

        let bigNumBalance = new BigNumber(balance);
        if (bigNumBalance.lessThan(bigMinAmount)) {
          return responseHelper.error({
            internal_error_identifier: 'l_ci_stp_validateBalance_2',
            api_error_identifier: 'insufficient_funds',
            error_config: basicHelper.fetchErrorConfig()
          });
        }

        return responseHelper.successWithData({balance: balance, bigNumBalance: bigNumBalance});
      })
      ;
  },

};

module.exports = StPrimeKlass;