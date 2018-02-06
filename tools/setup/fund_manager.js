"use strict";
/**
 * Fund Manager to give ETH on value chain, ST' on utility chain and transfer Simple Tokens
 *
 * @module tools/setup/fund_manager
 */
const BigNumber = require('bignumber.js')
;

const rootPrefix = "../.."
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , contractInteractHelper = require(rootPrefix + '/lib/contract_interact/helper')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
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
 * Constructor for fund manager
 *
 * @constructor
 *
 */
const FundManagerKlass = function () {};

FundManagerKlass.prototype = {
  /**
   * Transfer ETH on a particular chain from sender to receiver
   *
   * @param {string} senderAddr - address of user who is sending amount
   * @param {string} senderPassphrase - sender address passphrase
   * @param {string} recipient - address of user who is receiving amount
   * @param {BigNumber} amountInWei - amount which is being transferred
   *
   * @return {promise<result>}
   *
   */
  transferEth: async function(senderAddr, senderPassphrase, recipient, amountInWei) {
    const oThis = this
      , web3RpcProvider = web3ProviderFactory.getProvider('value', 'rpc')
      , gasPrice = coreConstants.OST_VALUE_GAS_PRICE
      , gas = coreConstants.OST_VALUE_GAS_LIMIT
    ;

    // validate addresses
    if (!contractInteractHelper.isAddressValid(senderAddr)) {
      return Promise.resolve(responseHelper.error('t_s_fm_1', `Invalid blockchain address: ${senderAddr}`));
    }
    if (!contractInteractHelper.isAddressValid(recipient)) {
      return Promise.resolve(responseHelper.error('t_s_fm_2', `Invalid blockchain address: ${recipient}`));
    }
    if (senderAddr.equalsIgnoreCase(recipient)) {
      return Promise.resolve(responseHelper.error('t_s_fm_3',
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
      return Promise.resolve(responseHelper.error('t_s_fm_4', `Invalid tramsfer amount: ${amountInWei}`));
    }

    // Validate sender balance
    const senderBalanceValidationResponse = await oThis.validateEthBalance(senderAddr, bigNumAmount);
    if (senderBalanceValidationResponse.isFailure()) {
      return Promise.resolve(senderBalanceValidationResponse);
    }

    // Perform transfer async
    const asyncTransfer = async function() {
      return web3RpcProvider.eth.personal.unlockAccount(senderAddr, senderPassphrase)
        .then(function() {
          return web3RpcProvider.eth.sendTransaction(
            {from: senderAddr, to: recipient, value: bigNumAmount.toString(10), gasPrice: gasPrice, gas: gas});
        })
        .then(function(transactionHash) {
          return responseHelper.successWithData({transactionHash: transactionHash});
        })
        .catch(function(reason) {
          return responseHelper.error('t_s_fm_5', 'Something went wrong');
        });
    };

    return asyncTransfer();
  },

  /**
   * Transfer ST
   *
   * @param {string} senderAddr - address of user who is sending amount
   * @param {string} senderPassphrase - sender address passphrase
   * @param {string} recipient - address of user who is receiving amount
   * @param {BigNumber} amountInWei - amount which is being transferred
   *
   * @return {promise<result>}
   *
   */
  transferST: async function(senderAddr, senderPassphrase, recipient, amountInWei) {
    const simpleToken = require(rootPrefix + '/lib/contract_interact/simple_token')
    ;

    return simpleToken.transfer(senderAddr, senderPassphrase, recipient, amountInWei)
  },

  /**
   * Transfer STPrime
   *
   * @param {string} senderAddr - address of user who is sending amount
   * @param {string} senderPassphrase - sender address passphrase
   * @param {string} recipient - address of user who is receiving amount
   * @param {BigNumber} amountInWei - amount which is being transferred
   *
   * @return {promise<result>}
   *
   */
  transferSTP: async function(senderAddr, senderPassphrase, recipient, amountInWei) {
    const stPrimeContractAddress = coreConstants.getAddressForContract('stPrime')
      , StPrimeKlass = require(rootPrefix + '/lib/contract_interact/st_prime')
      , stPrime = new StPrimeKlass(stPrimeContractAddress)
    ;

    return stPrime.transfer(senderAddr, senderPassphrase, recipient, amountInWei)
  },

  /**
   * Check if owner has required ETH balance (i.e. bigMinAmount)
   *
   * @param {string} owner - Account address
   * @param {BigNumber} bigMinAmount - minimum required balance in big number
   *
   * @return {promise<result>}
   *
   */
  validateEthBalance: function (owner, bigMinAmount) {
    const oThis = this;

    return oThis.getEthBalanceOf(owner)
      .then(function (response) {

        if (response.isFailure()) {
          return response;
        }

        var balance = response.data.balance;
        if (typeof balance === "undefined" || isNaN(Number(balance))) {
          return responseHelper.error('t_s_fm_6', 'Something went wrong');
        }

        var bigNumBalance = new BigNumber(balance);
        if (bigNumBalance.lessThan(bigMinAmount)) {
          return responseHelper.error('t_s_fm_7', 'Insufficient Funds');
        }

        return responseHelper.successWithData({balance: balance, bigNumBalance: bigNumBalance});
      });
  },

  /**
   * Get ETH Balance of an address
   *
   * @param {string} owner - address
   *
   * @return {promise<result>}
   *
   */
  getEthBalanceOf: function (owner) {
    const web3RpcProvider = web3ProviderFactory.getProvider('value', 'rpc')
    ;

    // Validate addresses
    if (!contractInteractHelper.isAddressValid(owner)) {
      return Promise.resolve(responseHelper.error('t_s_fm_8', `Invalid blockchain address: ${owner}`));
    }

    return web3RpcProvider.eth.getBalance(owner)
      .then(function(balance) {
        return responseHelper.successWithData({balance: balance});
      })
      .catch(function (err) {
        //Format the error
        logger.error(err);
        return responseHelper.error('t_s_fm_9', 'Something went wrong');
      });
  },

  /**
   * Get ST Prime Balance of an address
   *
   * @param {string} owner - address
   *
   * @return {promise<result>}
   *
   */
  getSTPrimeBalanceOf: function (owner) {
    const web3RpcProvider = web3ProviderFactory.getProvider('utility', 'rpc')
    ;

    // Validate addresses
    if (!contractInteractHelper.isAddressValid(owner)) {
      return Promise.resolve(responseHelper.error('t_s_fm_10', `Invalid blockchain address: ${owner}`));
    }

    return web3RpcProvider.eth.getBalance(owner)
      .then(function(balance) {
        return responseHelper.successWithData({balance: balance});
      })
      .catch(function (err) {
        //Format the error
        logger.error(err);
        return responseHelper.error('t_s_fm_11', 'Something went wrong');
      });
  },
};

module.exports = new FundManagerKlass();
