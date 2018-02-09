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
  , cacheModule = require('@openstfoundation/openst-cache')
  , openSTNotification = require('@openstfoundation/openst-notification')
;

//All other requires.
const rootPrefix = '../..'
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

// All other constants
const chainId = coreConstants.OST_UTILITY_CHAIN_ID
  , stPrimeContractAbi = coreAddresses.getAbiForContract('stPrime')
  , stPrimeContractObj = new web3RpcProvider.eth.Contract(stPrimeContractAbi)
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

  stPrimeContractObj.setProvider(web3RpcProvider.currentProvider);

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

    // Validate addresses
    if (!contractInteractHelper.isAddressValid(owner)) {
      return Promise.resolve(responseHelper.error('l_ci_stp_getBalanceOf_1', `Invalid blockchain address: ${owner}`));
    }

    const callback = async function (balanceFromChain) {
      //To-Do: Ensure cache is empty.
      //Someone else might have already fetched it and may be performing operations.
      //Aquire lock ?
      var cacheResult = await oThis.getBalanceFromCache(owner);
      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        //Ignore the balance we already have.
        return responseHelper.successWithData({balance: cacheResult.data.response});
      }

      //Cache it
      await oThis.setBalanceToCache(owner, new BigNumber(balanceFromChain));
      return responseHelper.successWithData({balance: balanceFromChain});
    };

    return oThis.getBalanceFromCache(owner)
      .then(function (cacheResult) {
        if (cacheResult.isSuccess() && cacheResult.data.response != null) {
          logger.info("balance cache hit");
          return responseHelper.successWithData({balance: cacheResult.data.response});
        } else {
          logger.info("balance cache miss");
          return web3RpcProvider.eth.getBalance(owner).then(callback);
        }
      })
      .catch(function (err) {
        //Format the error
        logger.error(err);
        return responseHelper.error('l_ci_stp_getBalanceOf_2', 'Something went wrong');
      })
      ;
  },

  /**
   * Initialize Transfer of ST Prime
   *
   * @param {string} senderName - address who is initializing this transfer - named managed key
   * @param {object} customOptions - custom params for this transaction
   *
   * @return {promise<result>}
   *
   */
  initializeTransfer: async function (senderName, customOptions) {
    const encodedABI = stPrimeContractObj.methods.initialize().encodeABI()
      , stPrimeTotalSupplyInWei = web3RpcProvider.utils.toWei(coreConstants.OST_UTILITY_STPRIME_TOTAL_SUPPLY, "ether");

    var options = {gasPrice: UC_GAS_PRICE, value: stPrimeTotalSupplyInWei, gas: UC_GAS_LIMIT};

    Object.assign(options, customOptions);

    return contractInteractHelper.safeSend(
      web3RpcProvider,
      this.contractAddress,
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
      , encodedABI = oThis.currContract.methods.claim(beneficiaryAddress).encodeABI();

    const currentGasPrice = new BigNumber(await web3RpcProvider.eth.getGasPrice())
    ;

    return contractInteractHelper.safeSendFromAddr(
      web3RpcProvider,
      oThis.contractAddress,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {
        gasPrice: (currentGasPrice.equals(0) ? '0x0' : UC_GAS_PRICE),
        gas: UC_GAS_LIMIT
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
   * @param {object} options - optional parameters - tag (extra param which gets logged into this transaction),
   *                                                 inAsync (true of one wants only the transaction hash and not wait till the mining)
   *
   * @return {promise<result>}
   *
   */
  transfer: async function (senderAddr, senderPassphrase, recipient, amountInWei, options) {
    const oThis = this
      , txUUID = options.uuid || uuid.v4() // use the parent uuid if available, else generate new
      , tag = options.tag
      , inAsync = options.inAsync
    ;

    logger.step("STPrime :: transfer initiated");

    // validate addresses
    if (!contractInteractHelper.isAddressValid(senderAddr)) {
      return Promise.resolve(responseHelper.error('l_ci_stp_transfer_1', `Invalid blockchain address: ${senderAddr}`));
    }
    if (!contractInteractHelper.isAddressValid(recipient)) {
      return Promise.resolve(responseHelper.error('l_ci_stp_transfer_2', `Invalid blockchain address: ${recipient}`));
    }

    if (senderAddr.equalsIgnoreCase(recipient)) {
      logger.error("STPrime :: transfer :: sender & recipient addresses are same");
      return Promise.resolve(responseHelper.error('l_ci_stp_transfer_3',
        `Same sender & recipient address provided. Sender: ${senderAddr} , Recipient: ${recipient}`));
    }

    // Convert amount in BigNumber
    var bigNumAmount = null;
    if (amountInWei instanceof BigNumber) {
      bigNumAmount = amountInWei;
    } else {
      var numAmount = Number(amountInWei);
      if (!isNaN(numAmount)) {
        bigNumAmount = new BigNumber(amountInWei);
      }
    }

    //Validate Transfer Amount
    if (!bigNumAmount || bigNumAmount.lessThan(1)) {
      return Promise.resolve(responseHelper.error('l_ci_bt_transfer_4', `Invalid tramsfer amount: ${amountInWei}`));
    }

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

    // rollback pessimistic caching
    const rollbackFn = function (response) {
      logger.error('=====Transaction Failed. Rollback Transfer =====');
      logger.error('response:', response);
      // Credit back to sender, in case of rollback
      oThis._creditBalanceInCache(senderAddr, bigNumAmount);
      return Promise.resolve(response);
    };

    // Perform transfer async
    const asyncTransfer = async function() {
      const txParams = {from: senderAddr, to: recipient, value: bigNumAmount.toString(10),
        gasPrice: UC_GAS_PRICE, gas: UC_GAS_LIMIT};

      return web3RpcProvider.eth.personal.unlockAccount(senderAddr, senderPassphrase)
        .then(function(){
            return web3RpcProvider.eth.sendTransaction(txParams)
              .on('transactionHash', function (transactionHash) {
                openSTNotification.publishEvent.perform(
                  {
                    topics: ['transfer.st_prime'],
                    message: {
                      kind: 'transaction_initiated',
                      payload: {
                        contract_name: '',
                        contract_address: '',
                        method: '',
                        params: {args: [], txParams: txParams},
                        transaction_hash: transactionHash,
                        chain_id: web3RpcProvider.chainId,
                        chain_kind: web3RpcProvider.chainKind,
                        uuid: txUUID,
                        tag: tag
                      }
                    }
                  }
                )
              });
          })
        .then(function(transactionHash) {
          logger.win("STPrime :: transfer successful.\n\ttransactionHash:", transactionHash);

          openSTNotification.publishEvent.perform(
            {
              topics: ['transaction_mined'],
              message: {
                kind: 'transaction_mined',
                payload: {
                  transaction_hash: transactionHash,
                  chain_id: web3RpcProvider.chainId,
                  chain_kind: web3RpcProvider.chainKind
                }
              }
            }
          );

          return responseHelper.successWithData({transactionHash: transactionHash, tag: tag});
        })
        .catch(function(reason) {
          logger.error("STPrime :: _transferInChain :: Transaction failed.\n\t Reason:", JSON.stringify(reason));
          return rollbackFn(responseHelper.error('l_ci_bt_transfer_5', `Transaction failed`));
        });
    };

    if (inAsync) {
      asyncTransfer();
      return Promise.resolve(responseHelper.successWithData(txUUID));
    } else {
      return asyncTransfer();
    }

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
      , cache_key = cacheKeys.stPrimeBalance(chainId, owner);

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
      , cache_key = cacheKeys.stPrimeBalance(chainId, owner);

    return cacheImplementer.set(cache_key, balance.toString(10));
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

    logger.step("_creditBalanceInCache called for :: " + owner + " :: bigAmount" + bigAmount.toString(10));

    return oThis.getBalanceOf(owner)
      .then(function (response) {
        if (response.isSuccess()) {
          var balance = response.data.balance;
          var bigBalance = new BigNumber(balance);
          bigBalance = bigBalance.plus(bigAmount);

          logger.info("_creditBalanceInCache :: balance :: " + balance);

          return oThis.setBalanceToCache(owner, bigBalance)
            .then(function (setResponse) {
              if (setResponse.isSuccess() && setResponse.data.response != null) {
                logger.win("_creditBalanceInCache :: cache set :: ");
                return responseHelper.successWithData({});
              }
              logger.error("_creditBalanceInCache :: cache could not be set");
              return responseHelper.error('l_ci_stp_creditBalanceInCache_1', 'Something went wrong')
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

    logger.step("_debitBalanceInCache called for :: " + owner + " :: bigAmount :: " + bigAmount.toString(10));

    return oThis.getBalanceOf(owner)
      .then(function (response) {
        if (response.isSuccess()) {

          var balance = response.data.balance
            , bigBalance = new BigNumber(balance);

          bigBalance = bigBalance.minus(bigAmount);

          logger.info("_debitBalanceInCache :: balance :: " + balance);

          return oThis.setBalanceToCache(owner, bigBalance)
            .then(function (setResponse) {
              if (setResponse.isSuccess() && setResponse.data.response != null) {
                logger.win("_debitBalanceInCache :: cache set :: ");
                return responseHelper.successWithData({});
              }
              logger.error("_debitBalanceInCache :: cache could not be set");
              return responseHelper.error('l_ci_stp_debitBalanceInCache_1', 'Something went wrong')
            });
        }
        return response;
      });
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
        return responseHelper.error('l_ci_stp_callMethod_' + methodName + '_1', 'Something went wrong');
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
          return responseHelper.error('l_ci_stp_validateBalance_1', 'Something went wrong');
        }

        var bigNumBalance = new BigNumber(balance);
        if (bigNumBalance.lessThan(bigMinAmount)) {
          return responseHelper.error('l_ci_stp_validateBalance_2', 'Insufficient Funds');
        }

        return responseHelper.successWithData({balance: balance, bigNumBalance: bigNumBalance});
      })
      ;
  },

};

module.exports = StPrimeKlass;