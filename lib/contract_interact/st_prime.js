"use strict";

/**
 *
 * Contract interaction methods for Simple Token Contract.<br><br>
 *
 * @module lib/contract_interact/st_prime
 *
 */

//All Module Requires.
const BigNumber = require('bignumber.js')
  , cacheModule = require('@openstfoundation/openst-cache')
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
  , cacheImplementer = cacheModule.cache
  , cacheKeys = cacheModule.OpenSTCacheKeys
;

//Some Executions.
stPrimeContractObj.setProvider(web3RpcProvider.currentProvider);

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

  if(this.contractAddress) {
    stPrimeContractObj.options.address = this.contractAddress;
    stPrimeContractObj.setProvider(web3RpcProvider.currentProvider);
  }

  this.currContract = stPrimeContractObj;
};

StPrimeKlass.prototype = {
  /**
   * Initialize Transfer of ST Prime
   *
   * @param {string} senderName - address who is initializing this transfer
   * @param {object} customOptions - custom params for this transaction
   *
   * @return {promise<result>}
   *
   */
  initializeTransfer: async function (senderName, customOptions) {
    const encodedABI = stPrimeContractObj.methods.initialize().encodeABI();

    const stPrimeTotalSupplyInWei = web3RpcProvider.utils.toWei(coreConstants.OST_UTILITY_STPRIME_TOTAL_SUPPLY, "ether");
    var options = {gasPrice: UC_GAS_PRICE, value: stPrimeTotalSupplyInWei};

    Object.assign(options, customOptions);

    return contractInteractHelper.safeSend(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderName,
      options
    );
  },

  /* 
    The methods below do not interact with the contract itself. 
    The methods below moc the behaviour of ST Prime as a branded token.
    We can move the methods below to somewhere else.
  */

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
      , isOwnerValid = contractInteractHelper.isAddressValid(owner)
    ;

    //Validation
    if (!isOwnerValid) {
      return Promise.resolve(responseHelper.error('ci_stp_1', `Invalid blockchain address: ${owner}`));
    }

    return oThis.getBalanceFromCache(owner)
      .then(function (cachedBalance) {
        if (cachedBalance.isSuccess() && cachedBalance.data.response!=null) {
          logger.info("balance cache hit");
          return cachedBalance.data.response;
        } else {
          return web3RpcProvider.eth.getBalance(owner)
            .then(async function (balance) {
              var existingRecord = await oThis.getBalanceFromCache(owner);
              if (existingRecord.isSuccess() && cachedBalance.data.response!=null) {
                //Ignore the balance we already have.
                return existingRecord.data.response;
              }

              //Cache it
              await oThis.setBalanceToCache(owner, new BigNumber(balance));
              return balance;
            })
            .catch(async function (resson) {
              var existingRecord = await oThis.getBalanceFromCache(owner);
              if (existingRecord.isSuccess() && cachedBalance.data.response!=null) {
                //Ignore the balance we already have.
                return existingRecord.data.response;
              }

              //We can't help. throw again.
              throw resson;
            })
            ;
        }
      })
      .then(function(balance) {
        //Format the response
        return responseHelper.successWithData({balance: balance});
      })
      .catch(function (err) {
        //Format the error
        logger.error(err);
        return responseHelper.error('ci_stp_2', 'Something went wrong');
      });
  },

  /**
   * Transfer ST Prime
   *
   * @param {String} sender - address of sender
   * @param {String} recipient - address of recipient
   * @param {String} amountInWei - amount in wei which is to be transferred
   * @param {String} tag - additional data that goes into this tranasction's log
   *
   * @return {promise<result>}
   *
   */
  transfer: function (sender, recipient, amountInWei, tag) {
    var oThis = this;
    logger.step("STPrime :: transfer initiated");

    if (!contractInteractHelper.isAddressValid(sender)) {
      logger.error("STPrime :: transfer :: sender address invalid");
      return Promise.resolve(responseHelper.error('ci_stp_1_v.1', `Invalid blockchain address: ${sender}`));
    }

    if (!contractInteractHelper.isAddressValid(recipient)) {
      logger.error("STPrime :: transfer :: recipient address invalid");
      return Promise.resolve(responseHelper.error('ci_stp_1_v.2', `Invalid blockchain address: ${recipient}`));
    }

    if (sender.toLowerCase() === recipient.toLowerCase()) {
      logger.error("STPrime :: transfer :: sender & recipient addresses are same");
      return Promise.resolve(responseHelper.error('ci_stp_1_v.2', `Same sender & recipient address provided. Sender: ${sender} , Recipient: ${recipient}`));
    }

    if (isNaN(Number(amountInWei))) {
      logger.error("STPrime :: transfer :: amountInWei invalid");
      return Promise.resolve(responseHelper.error('ci_stp_1_v.3', `Invalid amountInWei: ${amountInWei}`));
    }

    const bigAmount = new BigNumber(amountInWei);

    return oThis.getBalanceOf(sender)
      .then(response => {
        if (!response) {
          logger.error("STPrime :: transfer :: Failed not validate sender balance.");
          return Promise.resolve(responseHelper.error('ci_stp_1_v.4', `Failed not validate sender balance.`));
        } else if (!response.isSuccess()) {
          logger.error("STPrime :: transfer :: Failed not validate sender balance.");
          return response;
        }

        var balance = response.data.balance;
        balance = new BigNumber(balance);

        if (balance.lessThan(bigAmount)) {
          logger.error("STPrime :: transfer :: Insufficient balance.");
          return Promise.resolve(responseHelper.error('ci_stp_1_v.5', `Insufficient balance.`));
        }

        //Update Both Cache
        const cacheSenderPromise = oThis._debitBalanceInCache(sender, bigAmount);
        const cacheReceiverPromise = oThis._creditBalanceInCache(recipient, bigAmount);

        return oThis._transferInChain({
          "sender": sender
          , "recipient": recipient
          , "amount": bigAmount
          , "tag": tag
        });

      })
  },

  /**
   * Create a new managed account
   *
   * @param {String} passphrase - passphrase of this new account
   *
   * @return {promise<result>}
   *
   */
  newManagedAccount: function (passphrase) {
    return web3RpcProvider.eth.personal.newAccount(passphrase)
      .then(address => {
        return responseHelper.successWithData({
          address: address
        });
      })
      .catch(error => {
        return responseHelper.error("ci_stp_2_e.2", "Something went wrong");
      });
  },

  /**
   * Create a new managed account for a Member Company
   *
   * @return {promise<result>}
   *
   */
  newMemberManagedAccount: function () {
    //STUB METHOD.
    //Figure out various inputs required to generate passphrase.
    var input1 = ""
      , input2 = ""
      , input3 = ""
    ;
    const passphrase = contractInteractHelper.generateManagedKeyPassphrase(input1, input2, input3);
    return this.newManagedAccount(passphrase);
  },

  /**
   * Get passprhrase for a member company address
   *
   * @param {String} address - passphrase of this new account
   *
   * @return {string}
   *
   */
  getMemberPassphrase: function (address) {
    //STUB METHOD.
    //Figure out various inputs (based on address), required to generate passphrase.
    var input1 = ""
      , input2 = ""
      , input3 = ""
    ;

    return 'testtest';
  },

  /**
   * Get UUID
   *
   * @return {Result}
   *
   */
  getUuid: function () {
    const oThis = this;

    const transactionObject = oThis.currContract.methods.uuid();
    const encodeABI = transactionObject.encodeABI();
    const transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject);

    return contractInteractHelper.call(web3RpcProvider, oThis.contractAddress, encodeABI, transactionOutputs)
      .then(decodedResponse => {
        logger.info("decodedResponse", decodedResponse);
        if (decodedResponse instanceof Array) {
          logger.info("decodedResponse IS ARRAY");
          return decodedResponse[0];
        } else {
          logger.info("decodedResponse IS NOT ARRAY");
          return decodedResponse;
        }
      })
      .then(uuid => {
        return Promise.resolve(responseHelper.successWithData({uuid: uuid}));
      })
      .catch(function (err) {
        logger.error(err);
        return responseHelper.error('ci_ut_4', 'Something went wrong');
      })
      ;
  },

  /**
   * Get passprhrase for a member company address
   *
   * @param {String} senderAddress - address of sender
   * @param {String} senderPassphrase - passphrase of senderAddress
   * @param {String} beneficiaryAddress - address where funds would be credited
   *
   * @return {Result}
   *
   */
  claim: function (senderAddress, senderPassphrase, beneficiaryAddress) {
    const oThis = this;
    logger.info("beneficiaryAddress", beneficiaryAddress);
    const encodedABI = oThis.currContract.methods.claim(beneficiaryAddress).encodeABI();

    return contractInteractHelper.safeSendFromAddr(
      web3RpcProvider,
      oThis.contractAddress,
      encodedABI,
      senderAddress,
      senderPassphrase,
      {gasPrice: coreConstants.OST_UTILITY_GAS_PRICE}
    )

  },

  /**
   * get balance from cache
   *
   * @param {String} owner - address of user whose balance is to be found
   *
   * @return {Promise}
   *
   */
  getBalanceFromCache: function (owner) {
    const oThis = this
      , cache_key = cacheKeys.stPrimeBalance(chainId, owner);

    return cacheImplementer.get(cache_key)
  },

  /**
   * set balance to cache
   *
   * @param {String} owner - address of user whose balance is to be set
   * @param {BigNumber} balance - balance of the user
   *
   * @return {Promise}
   *
   */
  setBalanceToCache: function (owner, balance) {
    const oThis = this
      , cache_key = cacheKeys.stPrimeBalance(chainId, owner);

    return cacheImplementer.set(cache_key, balance.toString(10))
  },

  /**
   * @ignore
   */
  _getCacheKeyForBalance: function (address) {
    // Internal Method. Returns key name to be used for caching balance of an address
    return "stprime_balance_" + address.toLowerCase();
  },

  /**
   * @ignore
   */
  _creditBalanceInCache: function (owner, bigAmount) {

    // Internal Method. Credits Balance in Owner's Cache

    const oThis = this;

    return oThis.getBalanceOf(owner)
      .then(function (response) {
        if (response.isSuccess()) {

          var balance = response.data.balance;
          var bigBalance = new BigNumber(balance);
          bigBalance = bigBalance.plus(bigAmount);

          return oThis.setBalanceToCache(owner, bigBalance)
            .then(function(setResponse) {
              if (setResponse.isSuccess() && setResponse.data.response!=null) {
                return responseHelper.successWithData({});
              }
              return responseHelper.error('ci_stp_9', 'Something went wrong')
            })
            ;
        } else {
          return response;
        }
      })
      ;
  },

  /**
   * @ignore
   */
  _debitBalanceInCache: function (owner, bigAmount) {

    const oThis = this;

    return oThis.getBalanceOf(owner)
      .then(function (response) {
        if (response.isSuccess()) {
          var balance = response.data.balance
            , bigBalance = new BigNumber(balance);

          bigBalance = bigBalance.minus(bigAmount);

          return oThis.setBalanceToCache(owner, bigBalance)
            .then(function(setResponse) {
              if (setResponse.isSuccess() && setResponse.data.response!=null) {
                return responseHelper.successWithData({});
              }
              return responseHelper.error('ci_stp_10', 'Something went wrong')
            });
        } else {
          return response;
        }
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
  _callMethod: function(methodName, args) {
    const oThis = this
      , scope = oThis.currContract.methods
      , transactionObject = scope[methodName].apply(scope, (args || []))
      , encodeABI = transactionObject.encodeABI()
      , transactionOutputs = contractInteractHelper.getTransactionOutputs(transactionObject)
      , resultData = {};

    return contractInteractHelper.call(web3RpcProvider, oThis.contractAddress, encodeABI, {}, transactionOutputs)
      .then(function (decodedResponse) {
        return decodedResponse[0];
      })
      .then(function (response) {
        resultData[methodName] = response;
        return responseHelper.successWithData(resultData);
      })
      .catch(function (err) {
        logger.error(err);
        return responseHelper.error('l_ci_sp_callMethod_' + methodName + '_1', 'Something went wrong');
      })
  },

  /**
   * @ignore
   */
  _transferInChain: function (transferParams) {
    logger.info("STPrime :: _transferInChain initiated");
    const oThis = this
      , toAddress = transferParams.recipient
      , senderAddr = transferParams.sender
      , value = transferParams.amount.toString(10)
      , tag = transferParams.tag
      , senderPassphrase = oThis.getMemberPassphrase(senderAddr)
    ;

    return web3RpcProvider.eth.personal.unlockAccount(senderAddr, senderPassphrase)
      .then(_ => {
        return web3RpcProvider.eth.sendTransaction({
          from: senderAddr,
          to: toAddress,
          value: value,
          gasPrice: UC_GAS_PRICE
        })
          .then(transactionHash => {
            logger.win("STPrime :: transfer successful.\n\ttransactionHash:", transactionHash);
            return responseHelper.successWithData({transactionHash: transactionHash, tag: tag});
          })
          .catch(reason => {
            logger.error("STPrime :: _transferInChain :: Transaction failed.\n\t Reason:", JSON.stringify(resaon));
            return Promise.resolve(responseHelper.error('ci_stp_2_e.1', `Transaction failed`));
          });
      })
      .catch(reason => {
        logger.error("STPrime :: _transferInChain :: Failed to unlock account.\n\t Reason:", JSON.stringify(resaon));
        return Promise.resolve(responseHelper.error('ci_stp_2_v.1', `Failed to unlock account`));
      })
      ;
  },

};

module.exports = StPrimeKlass();