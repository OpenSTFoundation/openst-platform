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
;

const rootPrefix = '../..'
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , StPrimeKlass = require(rootPrefix + '/lib/contract_interact/st_prime')
  , web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

const contractName = 'brandedToken'
  , stPrimeTransferFactor = 3
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , chainId = coreConstants.OST_UTILITY_CHAIN_ID
  , stPrime = new StPrimeKlass(null)
  , UC_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE
  , UC_GAS_LIMIT = coreConstants.OST_UTILITY_GAS_LIMIT
  , cacheImplementer = cacheModule.cache
  , cacheKeys = cacheModule.OpenSTCacheKeys
;

/**
 * is equal ignoring case
 *
 * @param {string} compareWith - string to compare with
 *
 * @return {booelan} true when equal
 */
String.prototype.equalsIgnoreCase = function ( compareWith ) {
  const oThis = this
    , _self = this.toLowerCase()
    , _compareWith = String( compareWith ).toLowerCase();

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
  this.currContract = new web3RpcProvider.eth.Contract(contractAbi, this._getBTAddress());
  this.currContract.setProvider(web3RpcProvider.currentProvider);
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
      return Promise.resolve(responseHelper.error('l_ci_bt_getAllowance_1', `Invalid blockchain address: ${owner}`));
    }
    if (!basicHelper.isAddressValid(spender)) {
      return Promise.resolve(responseHelper.error('l_ci_bt_getAllowance_2', `Invalid blockchain address: ${spender}`));
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
  getBalanceOf: function (owner) {
    const oThis = this
    ;

    // Validate addresses
    if (!basicHelper.isAddressValid(owner)) {
      return Promise.resolve(responseHelper.error('l_ci_bt_getBalanceOf_1', `Invalid blockchain address: ${owner}`));
    }

    const callback = async function (response) {
      //To-Do: Ensure cache is empty.
      //Someone else might have already fetched it and may be performing operations.
      //Aquire lock ?
      var cacheResult = await oThis.getBalanceFromCache(owner);
      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        //Ignore the balance we already have.
        return responseHelper.successWithData({balance: cacheResult.data.response});
      }
      //We can't help. throw again.
      if (response.isFailure()) {
        throw response;
      }
      //Cache it
      await oThis.setBalanceToCache(owner, new BigNumber(response.data.balanceOf));
      return responseHelper.successWithData({balance: response.data.balanceOf});
    };

    return oThis.getBalanceFromCache(owner)
      .then(function (cacheResult) {

        if (cacheResult.isSuccess() && cacheResult.data.response != null) {
          //logger.info("balance cache hit");  //DEBUG
          return responseHelper.successWithData({balance: cacheResult.data.response});
        } else {
          //logger.info("balance cache miss");  //DEBUG

          return oThis._callMethod('balanceOf', [owner]).then(callback);
        }

      })
      .catch(function (err) {
        //Format the error
        logger.error(err);
        return responseHelper.error('l_ci_bt_getBalanceOf_2', 'Something went wrong');
      })

      ;
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
          message: {
            kind: '', // populate later: with every stage
            payload: {
              contract_name: contractName,
              contract_address: oThis._getBTAddress(),
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
      return Promise.resolve(responseHelper.error('l_ci_bt_transfer_1', `Invalid blockchain address: ${senderAddr}`));
    }
    if (!basicHelper.isAddressValid(recipient)) {
      return Promise.resolve(responseHelper.error('l_ci_bt_transfer_2', `Invalid blockchain address: ${recipient}`));
    }
    if (senderAddr.equalsIgnoreCase(recipient)) {
      logger.error("BT :: transfer :: sender & recipient addresses are same");
      return Promise.resolve(responseHelper.error('l_ci_bt_transfer_3',
        `Same sender & recipient address provided. Sender: ${senderAddr} , Recipient: ${recipient}`));
    }
    if (!basicHelper.isNonZeroWeiValid(amountInWei)) {
      return Promise.resolve(responseHelper.error('l_ci_bt_transfer_4', `Invalid amount: ${amountInWei}`));
    }
    if (!basicHelper.isTagValid(tag)) {
      return Promise.resolve(responseHelper.error('l_ci_bt_transfer_5', 'Invalid transaction tag'));
    }

    // Convert amount in BigNumber
    var bigNumAmount = basicHelper.convertToBigNumber(amountInWei);

    // Validate sender balance
    const senderBalanceResponse = await oThis._validateBalance(senderAddr, bigNumAmount);
    if (senderBalanceResponse.isFailure()) {
      return Promise.resolve(senderBalanceResponse);
    }

    // Update Cache and not waiting for promise resolution. Pessimistically reducing the balance.
    const debitBalanceInCacheResponse = await oThis._debitBalanceInCache(senderAddr, bigNumAmount);
    if (debitBalanceInCacheResponse.isFailure()) {
      return Promise.resolve(debitBalanceInCacheResponse);
    }

    // TODO: Should we check ST' balance?

    // Perform transfer async
    const asyncTransfer = function() {

      // set txParams for firing event
      const rawTxParams = {from: senderAddr, to: recipient, value: bigNumAmount.toString(10),
        gasPrice: UC_GAS_PRICE, gas: UC_GAS_LIMIT}; // TODO: gas should be computed value

      // set params in notification data
      notificationData.message.payload.params.txParams = rawTxParams; // one time

      const encodedABI = oThis.currContract.methods.transfer(recipient, bigNumAmount.toString(10)).encodeABI();

      // set txParams for executing transaction
      const txParams = {
        from: senderAddr,
        to: oThis._getBTAddress(),
        data: encodedABI,
        gasPrice: UC_GAS_PRICE,
        gas: UC_GAS_LIMIT
      };

      // Unlock account and send transaction
      return new Promise(function (onResolve, onReject) {
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
              .on('receipt', function(receipt){

                //Credit the amount to the recipient.
                oThis._creditBalanceInCache(recipient, bigNumAmount);

                // Publish event
                notificationData.message.kind = 'transaction_mined';
                openSTNotification.publishEvent.perform(notificationData);

                // send response
                if (basicHelper.isReturnTypeTxReceipt(returnType)) {
                  return onResolve(responseHelper.successWithData({transaction_uuid: txUUID, transaction_hash: receipt.transactionHash, transaction_receipt: receipt}));
                }
              })
          })
          .catch(function(reason) {
            logger.error("BT :: Transaction failed. Rollback balance in cache \n\t Reason:", JSON.stringify(reason));

            // Credit back to sender, in case of rollback
            oThis._creditBalanceInCache(senderAddr, bigNumAmount);

            // set error data in notification data
            notificationData.message.payload.error_data = reason;
            // Publish event
            notificationData.message.kind = 'error';
            openSTNotification.publishEvent.perform(notificationData);

            // send response
            return onResolve(responseHelper.error('l_ci_bt_transfer_6', 'Transaction failed'));
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

    addressToNameMap[oThis._getBTAddress().toLowerCase()] = contractName;

    const claimResponse = await contractInteractHelper.safeSendFromAddr(web3RpcProvider, oThis._getBTAddress(), encodedABI,
      senderAddress, senderPassphrase, {gasPrice: UC_GAS_PRICE}, addressToNameMap);

    const formattedTxReceipt = claimResponse.data.formattedTransactionReceipt
      , formattedEvents = await web3EventsFormatter.perform(formattedTxReceipt)
    ;

    if (!formattedEvents || !formattedEvents['Transfer']) {
      // this is a error scenario.
      return Promise.resolve(responseHelper.error('l_ci_bt_claim_1', 'Transfer event not found in claim receipt.'));
    }

    const bigNumAmount = new BigNumber(formattedEvents['Transfer']._value);

    oThis._creditBalanceInCache(beneficiaryAddress, bigNumAmount)

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
   * @return {promise<string>}
   *
   */
  approve: async function (ownerAddress, ownerPassphrase, spenderAddress, value, inAsync) {

    const oThis = this
      , encodedABI = oThis.currContract.methods.approve(spenderAddress, value).encodeABI();

    return contractInteractHelper.sendTxAsyncFromAddr(web3RpcProvider, oThis._getBTAddress(), encodedABI,
      ownerAddress, ownerPassphrase, {gasPrice: UC_GAS_PRICE});
  },

  /**
   * Get balance from cache
   *
   * @param {string} owner - address of user whose balance is to be found
   *
   * @return {promise<result>}
   *
   */
  getBalanceFromCache: function (owner) {
    const oThis = this
      , cache_key = cacheKeys.btBalance(chainId, oThis._getBTAddress(), owner);

    return cacheImplementer.get(cache_key);
  },

  /**
   * Set balance to cache
   *
   * @param {string} owner - address of user whose balance is to be set
   * @param {BigNumber} balance - balance of the user
   *
   * @return {promise<result>}
   *
   */
  setBalanceToCache: function (owner, balance) {
    const oThis = this
      , cache_key = cacheKeys.btBalance(chainId, oThis._getBTAddress(), owner);

    return cacheImplementer.set(cache_key, balance.toString(10));
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
  _creditBalanceInCache: function (owner, bigAmount) {

    // Internal Method. Credits Balance in Owner's Cache

    const oThis = this;

    //logger.step("_creditBalanceInCache called for :: " + owner + " :: bigAmount" + bigAmount.toString(10));  //DEBUG

    return oThis.getBalanceOf(owner)
      .then(function (response) {
        if (response.isSuccess()) {
          var balance = response.data.balance;
          var bigBalance = new BigNumber(balance);
          bigBalance = bigBalance.plus(bigAmount);

          //logger.info("_creditBalanceInCache :: balance :: " + balance); //DEBUG

          return oThis.setBalanceToCache(owner, bigBalance)
            .then(function (setResponse) {
              if (setResponse.isSuccess() && setResponse.data.response != null) {
                //logger.win("_creditBalanceInCache :: cache set :: "); //DEBUG
                return responseHelper.successWithData({});
              }
              logger.error("_creditBalanceInCache :: cache could not be set");
              return responseHelper.error('l_ci_bt_creditBalanceInCache_1', 'Something went wrong')
            });
        }
        return response;
      });
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
  _debitBalanceInCache: function (owner, bigAmount) {

    const oThis = this;

    //logger.step("_debitBalanceInCache called for :: " + owner + " :: bigAmount :: " + bigAmount.toString(10)); //DEBUG

    return oThis.getBalanceOf(owner)
      .then(function (response) {
        if (response.isSuccess()) {

          var balance = response.data.balance
            , bigBalance = new BigNumber(balance);

          bigBalance = bigBalance.minus(bigAmount);

          //logger.info("_debitBalanceInCache :: balance :: " + balance);  //DEBUG

          return oThis.setBalanceToCache(owner, bigBalance)
            .then(function (setResponse) {
              if (setResponse.isSuccess() && setResponse.data.response != null) {
                //logger.win("_debitBalanceInCache :: cache set :: ");  //DEBUG
                return responseHelper.successWithData({});
              }
              logger.error("_debitBalanceInCache :: cache could not be set");
              return responseHelper.error('l_ci_bt_debitBalanceInCache_1', 'Something went wrong')
            });
        }
        return response;
      });
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
  _callMethod: function(methodName, args) {
    const oThis = this
      , btAddress = oThis._getBTAddress()
      , scope = oThis.currContract.methods
      , transactionObject = scope[methodName].apply(scope, (args || []))
      , encodeABI = transactionObject.encodeABI()
      , transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject)
      , resultData = {};

    return contractInteractHelper.call(web3RpcProvider, btAddress, encodeABI, {}, transactionOutputs)
      .then(function (decodedResponse) {
        return decodedResponse[0];
      })
      .then(function (response) {
        resultData[methodName] = response;
        return responseHelper.successWithData(resultData);
      })
      .catch(function (err) {
        logger.error(err);
        return responseHelper.error('l_ci_bt_callMethod_'+methodName+'_1', 'Something went wrong');
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
  _validateBalance: function (owner, bigMinAmount) {
    const oThis = this;

    return oThis.getBalanceOf(owner)
      .then(function (response) {

        if (response.isFailure()) {
          return response;
        }

        var balance = response.data.balance;
        if (typeof balance === "undefined" || isNaN(Number(balance))) {
          return responseHelper.error('l_ci_bt_validateBalance_1', 'Something went wrong');
        }

        var bigNumBalance = new BigNumber(balance);
        if (bigNumBalance.lessThan(bigMinAmount)) {
          return responseHelper.error('l_ci_bt_validateBalance_2', 'Insufficient Funds');
        }

        return responseHelper.successWithData({balance: balance, bigNumBalance: bigNumBalance});
      })
      ;
  },

};

module.exports = BrandedTokenKlass;