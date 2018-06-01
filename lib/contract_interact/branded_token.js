"use strict";

/**
 * Contract interaction methods for branded token EIP20 contract.<br><br>
 *
 * @module lib/contract_interact/branded_token
 *
 */

const uuid = require('uuid')
  , BigNumber = require('bignumber.js')
  , cacheModule = require('@openstfoundation/openst-cache')
  , openSTNotification = require('@openstfoundation/openst-notification')
  , openSTStorage = require('@openstfoundation/openst-storage')
;

const rootPrefix = '../..'
  , web3Provider = require(rootPrefix + '/lib/web3/providers/utility_ws')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , EstimateGasKlass = require(rootPrefix + '/services/transaction/estimate_gas')
  , ddbServiceObj = require(rootPrefix + '/lib/dynamoDB_service')
  // , autoscalingServiceObj = require(rootPrefix + '/lib/auto_scaling_service')
;

const brandedTokenContractName = 'brandedToken'
  , contractAbi = coreAddresses.getAbiForContract(brandedTokenContractName)
  , chainId = coreConstants.OST_UTILITY_CHAIN_ID
  , UC_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE
  , cacheImplementer = new cacheModule.cache(coreConstants.CACHING_ENGINE, true)
  , cacheKeys = cacheModule.OpenSTCacheKeys
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
 * Constructor to create object of BrandedTokenKlass
 *
 * @constructor
 *
 * @param {object} memberObject -
 * @param {string} memberObject.ERC20 - Branded token EIP20 address
 *
 */
const BrandedTokenKlass = function (memberObject) {
  this.memberObject = memberObject;
  this.currContract = new web3Provider.eth.Contract(contractAbi, this._getBTAddress());
  //this.currContract.setProvider(web3Provider.currentProvider);
};

BrandedTokenKlass.prototype = {

  currContract: null,
  memberObject: null,

  /**
   * Get branded token name
   *
   * @return {promise<result>}
   *
   */
  getName: function () {
    const oThis = this;
    return oThis._callMethod('name');
  },

  /**
   * Get branded token symbol
   *
   * @return {promise<result>}
   *
   */
  getSymbol: function () {
    const oThis = this;
    return oThis._callMethod('symbol');
  },

  /**
   * Get branded token decimal precision
   *
   * @return {promise<result>}
   *
   */
  getDecimals: function () {
    const oThis = this;
    return oThis._callMethod('decimals');
  },

  /**
   * Get branded token UUID
   *
   * @return {promise<result>}
   *
   */
  getUuid: function () {
    const oThis = this;
    return oThis._callMethod('uuid');
  },

  /**
   * Get branded token total supply
   *
   * @return {promise<result>}
   *
   */
  getTotalSupply: function () {
    const oThis = this;
    return oThis._callMethod('totalSupply');
  },

  /**
   * Get branded token allowance
   *
   * @param {string} owner - Owner address
   * @param {string} spender - Spender address
   *
   * @return {promise<result>}
   *
   */
  getAllowance: function (owner, spender) {
    const oThis = this;

    // Validate addresses
    if (!basicHelper.isAddressValid(owner)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_bt_getAllowance_1',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }
    if (!basicHelper.isAddressValid(spender)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_bt_getAllowance_2',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }

    return oThis._callMethod('allowance', [owner, spender]);
  },

  /**
   * Fetch Balance For a given address
   *
   * @param {string} owner - address for which balance is to be fetched
   *
   * @return {promise<result>}
   *
   */
  getBalanceOf: async function (owner) {
    const oThis = this
    ;

    // Validate addresses
    if (!basicHelper.isAddressValid(owner)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_bt_getBalanceOf_1',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }

    const balanceResponse = await new openSTStorage.TokenBalanceCache({
      ddb_service: ddbServiceObj,
      auto_scaling: null,
      erc20_contract_address: oThis._getBTAddress(),
      ethereum_addresses: [owner]
    }).fetch();

    if (balanceResponse.isFailure()) {
      return Promise.resolve(balanceResponse);
    }

    const ownerBalance = balanceResponse.data[owner].available_balance;

    return responseHelper.successWithData({balance: ownerBalance});

  },

  /**
   * Transfer branded tokens
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
        topics: ['transfer.branded_token'],
        publisher: 'OST',
        message: {
          kind: '', // populate later: with every stage
          payload: {
            contract_name: brandedTokenContractName,
            contract_address: oThis._getBTAddress(),
            erc20_contract_address: oThis._getBTAddress(),
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
        internal_error_identifier: 'l_ci_bt_transfer_1',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }
    if (!basicHelper.isAddressValid(recipient)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_bt_transfer_2',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }
    if (senderAddr.equalsIgnoreCase(recipient)) {
      logger.error("BT :: transfer :: sender & recipient addresses are same");

      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_bt_transfer_3',
        api_error_identifier: 'sender_and_recipient_same',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }
    if (!basicHelper.isNonZeroWeiValid(amountInWei)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_bt_transfer_4',
        api_error_identifier: 'invalid_amount',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }
    if (!basicHelper.isTagValid(tag)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_bt_transfer_5',
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

    if(coreConstants.STANDALONE_MODE == '1') {
      // Update Cache and not waiting for promise resolution. Pessimistically reducing the balance.
      const pessimisticDebitResponse = await oThis._pessimisticDebit(senderAddr, bigNumAmount);
      if (pessimisticDebitResponse.isFailure()) {
        return Promise.resolve(pessimisticDebitResponse);
      }
    }

    // TODO: Should we check ST' balance?

    // Perform transfer async
    const asyncTransfer = async function () {

      const encodedABI = oThis.currContract.methods.transfer(recipient, bigNumAmount.toString(10)).encodeABI();

      const estimateGasObj = new EstimateGasKlass({
        contract_name: brandedTokenContractName,
        contract_address: oThis._getBTAddress(),
        chain: 'utility',
        sender_address: senderAddr,
        method_name: 'transfer',
        method_arguments: [recipient, bigNumAmount.toString(10)]
      });

      const estimateGasResponse = await estimateGasObj.perform()
        , gasToUse = estimateGasResponse.data.gas_to_use
      ;

      // set txParams for firing event
      const rawTxParams = {
        from: senderAddr, to: recipient, value: bigNumAmount.toString(10),
        gasPrice: UC_GAS_PRICE, gas: gasToUse
      };

      // set params in notification data
      notificationData.message.payload.params.txParams = rawTxParams; // one time

      // set txParams for executing transaction
      const txParams = {
        from: senderAddr,
        to: oThis._getBTAddress(),
        data: encodedABI,
        gasPrice: UC_GAS_PRICE,
        gas: gasToUse
      };

      // Unlock account and send transaction
      return new Promise(function (onResolve, onReject) {
        const onReceipt = async function (receipt) {
          if(coreConstants.STANDALONE_MODE == '1') {
            //Credit the amount to the recipient.
            await oThis._creditBalance(recipient, bigNumAmount);
            //Debit the amount to the sender.
            await oThis._debitBalance(senderAddr, bigNumAmount);
          }
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
            logger.error("BT :: Transaction failed. Rollback balance in cache \n\t Reason:", JSON.stringify(reason));

            const onCatchError = async function () {
              if(coreConstants.STANDALONE_MODE == '1') {
                // revert sender's pessimistic bedit, in case of rollback
                await oThis._pessimisticDebit(senderAddr, bigNumAmount.mul(new BigNumber(-1)));
              }
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
   * Claim minted branded tokens
   *
   * @param {string} senderAddress - address of sender
   * @param {string} senderPassphrase - passphrase of sender
   * @param {string} beneficiaryAddress - address to which balance would be credited
   *
   * @return {promise<result>}
   */
  claim: async function (senderAddress, senderPassphrase, beneficiaryAddress) {

    const oThis = this
      , encodedABI = oThis.currContract.methods.claim(beneficiaryAddress).encodeABI()
      , addressToNameMap = {};

    addressToNameMap[oThis._getBTAddress().toLowerCase()] = brandedTokenContractName;

    const estimateGasObj = new EstimateGasKlass({
      contract_name: brandedTokenContractName,
      contract_address: oThis._getBTAddress(),
      chain: 'utility',
      sender_address: senderAddress,
      method_name: 'claim',
      method_arguments: [beneficiaryAddress]
    });

    const estimateGasResponse = await estimateGasObj.perform()
      , gasToUse = estimateGasResponse.data.gas_to_use
    ;

    const claimResponse = await contractInteractHelper.safeSendFromAddr(web3Provider, oThis._getBTAddress(), encodedABI,
      senderAddress, senderPassphrase, {gasPrice: UC_GAS_PRICE, gas: gasToUse}, addressToNameMap);

    const formattedTxReceipt = claimResponse.data.formattedTransactionReceipt
      , formattedEvents = await web3EventsFormatter.perform(formattedTxReceipt)
    ;

    if (!formattedEvents || !formattedEvents['Transfer']) {
      // this is a error scenario.
      let errObj = responseHelper.error({
        internal_error_identifier: 'l_ci_bt_claim_1',
        api_error_identifier: 'event_not_found_in_transaction_receipt',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }

    if(coreConstants.STANDALONE_MODE == '1'){
      const bigNumAmount = new BigNumber(formattedEvents['Transfer']._value);
      oThis._creditBalance(beneficiaryAddress, bigNumAmount);
    }

    return claimResponse;
  },

  /**
   * Method by which ownerAddress authorizes spenderAddress to spend value on their behalf.
   *
   * @param {string} ownerAddress - address which authorizes spenderAddress to spend value
   * @param {string} ownerPassphrase - passphrase of ownerAddress
   * @param {string} spenderAddress - address which is authorized to spend value
   * @param {number} value - value
   * @param {boolean} inAsync - true of one wants only the transaction hash and not wait till the mining
   *
   * @return {promise<result>}
   *
   */
  approve: async function (ownerAddress, ownerPassphrase, spenderAddress, value, inAsync) {

    const oThis = this
      , encodedABI = oThis.currContract.methods.approve(spenderAddress, value).encodeABI()
    ;

    const estimateGasObj = new EstimateGasKlass({
      contract_name: brandedTokenContractName,
      contract_address: oThis._getBTAddress(),
      chain: 'utility',
      sender_address: ownerAddress,
      method_name: 'approve',
      method_arguments: [spenderAddress, value]
    });

    const estimateGasResponse = await estimateGasObj.perform()
      , gasToUse = estimateGasResponse.data.gas_to_use
    ;

    if (inAsync) {

      const transactionHash = await contractInteractHelper.sendTxAsyncFromAddr(web3Provider, oThis._getBTAddress(), encodedABI,
        ownerAddress, ownerPassphrase, {gasPrice: UC_GAS_PRICE, gas: gasToUse});

      return Promise.resolve(responseHelper.successWithData({transaction_hash: transactionHash}));

    } else {
      const transactionReceipt = await contractInteractHelper.safeSendFromAddr(
        web3Provider,
        oThis._getBTAddress(),
        encodedABI,
        ownerAddress,
        ownerPassphrase,
        {gasPrice: UC_GAS_PRICE, gas: gasToUse}
      );
      return Promise.resolve(transactionReceipt);
    }

  },

  /**
   * @ignore
   */
  _getBTAddress: function () {
    // Internal Method. Returns ERC20 Address mentioned in config.
    return this.memberObject.ERC20;
  },

  /**
   * Credit balance in cache for pessimistic caching
   *
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be credited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  _creditBalance: async function (owner, bigAmount) {

    const oThis = this;

    const balanceUpdateResponse = await new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj,
      auto_scaling: null,
      erc20_contract_address: oThis._getBTAddress()
    }).update({
      ethereum_address: owner,
      settle_amount: bigAmount.toString(10)
    }).catch(function (error) {
      return error;
    });

    if (balanceUpdateResponse.isFailure()) {
      return balanceUpdateResponse;
    }
    return responseHelper.successWithData({});

  },


  /**
   * Debit balance in cache for pessimistic caching
   * Note: to debit balance pass negative value to TokenBalanceModel in openSTStorage.
   *
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be credited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  _debitBalance: async function (owner, bigAmount) {

    const oThis = this
      ,  debitAmount = bigAmount.mul(new BigNumber(-1));

    const balanceUpdateResponse = await new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj,
      auto_scaling: null,
      erc20_contract_address: oThis._getBTAddress()
    }).update({
      ethereum_address: owner,
      settle_amount: debitAmount.toString(10),
      un_settled_debit_amount: debitAmount.toString(10)
    }).catch(function (error) {
      return error;
    });

    if (balanceUpdateResponse.isFailure()) {
      return balanceUpdateResponse;
    }
    return responseHelper.successWithData({});

  },

  /**
   * Debit balance in cache for pessimistic caching
   *
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be debited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  _pessimisticDebit: async function (owner, bigAmount) {

    const oThis = this;

    const balanceUpdateResponse = await new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj,
      auto_scaling: null,
      erc20_contract_address: oThis._getBTAddress()
    }).update({
      ethereum_address: owner,
      un_settled_debit_amount: bigAmount.toString(10)
    }).catch(function (error) {
      return error;
    });

    if (balanceUpdateResponse.isFailure()) {
      return balanceUpdateResponse;
    }
    return responseHelper.successWithData({});

  },

  /**
   * Get branded token properties like name, symbol etc
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
      , btAddress = oThis._getBTAddress()
      , scope = oThis.currContract.methods
      , transactionObject = scope[methodName].apply(scope, (args || []))
      , encodeABI = transactionObject.encodeABI()
      , transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject)
      , resultData = {};

    return contractInteractHelper.call(web3Provider, btAddress, encodeABI, {}, transactionOutputs)
      .then(function (decodedResponse) {
        return decodedResponse[0];
      })
      .then(function (response) {
        resultData[methodName] = response;
        return responseHelper.successWithData(resultData);
      })
      .catch(function (err) {
        logger.error(err);
        return responseHelper.error({
          internal_error_identifier: 'l_ci_bt_callMethod_' + methodName + '_1',
          api_error_identifier: 'something_went_wrong',
          error_config: basicHelper.fetchErrorConfig()
        });
      })
      ;
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
  _validateBalance: async function (owner, bigMinAmount) {
    const oThis = this;

    const balanceResponse = await new openSTStorage.TokenBalanceCache({
      ddb_service: ddbServiceObj,
      auto_scaling: null,
      erc20_contract_address: oThis._getBTAddress(),
      ethereum_addresses: [owner]
    }).fetch();

    if (balanceResponse.isFailure()) {
      return balanceResponse;
    }

    const ownerBalance = balanceResponse.data[owner].available_balance;
    const bigNumOwnerBalance = new BigNumber(ownerBalance);

    if (bigNumOwnerBalance.lessThan(bigMinAmount)) {
      return responseHelper.error({
        internal_error_identifier: 'l_ci_bt_validateBalance_2',
        api_error_identifier: 'insufficient_funds',
        error_config: basicHelper.fetchErrorConfig()
      });
    }

    return responseHelper.successWithData({balance: ownerBalance, bigNumBalance: bigNumOwnerBalance});

  },

};

module.exports = BrandedTokenKlass;