"use strict";
/**
 * Fund Manager to give ETH on value chain, ST' on utility chain and transfer Simple Tokens
 *
 * @module lib/fund_manager
 */
const BigNumber = require('bignumber.js')
;

const rootPrefix = ".."
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
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
    // TODO: should we have isAsync with UUID (unlock account will take time) and also tag, publish events?
    const oThis = this
      , web3RpcProvider = web3ProviderFactory.getProvider('value', 'rpc')
      , gasPrice = coreConstants.OST_VALUE_GAS_PRICE
      , gas = coreConstants.OST_VALUE_GAS_LIMIT
    ;

    // Validations
    if (!basicHelper.isAddressValid(senderAddr)) {
      return Promise.resolve(responseHelper.error('t_s_fm_1', `Invalid blockchain address: ${senderAddr}`));
    }
    if (!basicHelper.isAddressValid(recipient)) {
      return Promise.resolve(responseHelper.error('t_s_fm_2', `Invalid blockchain address: ${recipient}`));
    }
    if (senderAddr.equalsIgnoreCase(recipient)) {
      return Promise.resolve(responseHelper.error('t_s_fm_3',
        `Same sender & recipient address provided. Sender: ${senderAddr} , Recipient: ${recipient}`));
    }
    if (!basicHelper.isNonZeroWeiValid(amountInWei)) {
      return Promise.resolve(responseHelper.error('t_s_fm_4', `Invalid amount: ${amountInWei}`));
    }

    // Convert amount in BigNumber
    var bigNumAmount = basicHelper.convertToBigNumber(amountInWei);

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
   * Transfer Branded Token
   *
   * @param {string} erc20Address - address of erc20 contract address
   * @param {string} reserveAddress - branded token reserve address
   * @param {string} reservePassphrase - branded token reserve address passphrase
   * @param {string} senderAddr - address of user who is sending amount
   * @param {string} senderPassphrase - sender address passphrase
   * @param {string} recipient - address of user who is receiving amount
   * @param {BigNumber} amountInWei - amount which is being transferred in Weis
   *
   * @return {promise<result>}
   */
  transferBrandedToken: async function(erc20Address, reserveAddress, reservePassphrase,
                                       senderAddr, senderPassphrase, recipient, amountInWei) {

    const BrandedTokenKlass = require(rootPrefix + '/lib/contract_interact/branded_token')
      , brandedToken = new BrandedTokenKlass({ERC20: erc20Address, Reserve: reserveAddress})
    ;

    return brandedToken.transfer(senderAddr, senderPassphrase, reservePassphrase, recipient, amountInWei)
  },

  /**
   * Transfer ST
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
  transferST: async function(senderAddr, senderPassphrase, recipient, amountInWei, options) {
    const simpleToken = require(rootPrefix + '/lib/contract_interact/simple_token')
    ;

    return simpleToken.transfer(senderAddr, senderPassphrase, recipient, amountInWei, options);

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
    const stPrimeContractAddress = coreAddresses.getAddressForContract('stPrime')
      , StPrimeKlass = require(rootPrefix + '/lib/contract_interact/st_prime')
      , stPrime = new StPrimeKlass(stPrimeContractAddress)
    ;

    return stPrime.transfer(senderAddr, senderPassphrase, recipient, amountInWei, {returnType: 'txReceipt', tag: 'GasRefill'})
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
    if (!basicHelper.isAddressValid(owner)) {
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
    if (!basicHelper.isAddressValid(owner)) {
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

  /**
   * Get ST Balance of an address
   *
   * @param {string} owner - address
   *
   * @return {promise<result>}
   *
   */
  getSTBalanceOf: function (owner) {
    const simpleToken = require(rootPrefix + '/lib/contract_interact/simple_token')
    ;

    return simpleToken.balanceOf(owner);
  },

  /**
   * Get Branded Token Balance of an address
   *
   * @param {string} erc20Address - address of erc20 contract address
   * @param {string} owner - address
   *
   * @return {promise<result>}
   *
   */
  getBrandedTokenBalanceOf: function (erc20Address, owner) {
    const BrandedTokenKlass = require(rootPrefix + '/lib/contract_interact/branded_token')
      , brandedToken = new BrandedTokenKlass({ERC20: erc20Address})
    ;

    return brandedToken.getBalanceOf(owner);
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
};

module.exports = new FundManagerKlass();
