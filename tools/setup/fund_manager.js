'use strict';
/**
 * Fund Manager to give ETH on value chain, ST' on utility chain and transfer Simple Tokens
 *
 * @module lib/fund_manager
 */
const BigNumber = require('bignumber.js');

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  basicHelper = require(rootPrefix + '/helpers/basic_helper');
require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/lib/contract_interact/branded_token');
require(rootPrefix + '/lib/contract_interact/simple_token');
require(rootPrefix + '/lib/contract_interact/st_prime');

/**
 * Constructor for fund manager
 *
 * @constructor
 *
 */
const FundManagerKlass = function(configStrategy, instanceComposer) {};

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
    const oThis = this,
      coreConstants = oThis.ic().getCoreConstants(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3Provider = web3ProviderFactory.getProvider('value', 'ws'),
      gasPrice = coreConstants.OST_VALUE_GAS_PRICE,
      gas = coreConstants.OST_VALUE_GAS_LIMIT;

    // Validations
    if (!basicHelper.isAddressValid(senderAddr)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 't_s_fm_1',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }

    if (!basicHelper.isAddressValid(recipient)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 't_s_fm_2',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }

    if (senderAddr.equalsIgnoreCase(recipient)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 't_s_fm_3',
        api_error_identifier: 'sender_and_recipient_same',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }

    if (!basicHelper.isNonZeroWeiValid(amountInWei)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 't_s_fm_4',
        api_error_identifier: 'invalid_amount',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
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
      return web3Provider.eth.personal
        .unlockAccount(senderAddr, senderPassphrase)
        .then(function() {
          return web3Provider.eth.sendTransaction({
            from: senderAddr,
            to: recipient,
            value: bigNumAmount.toString(10),
            gasPrice: gasPrice,
            gas: gas
          });
        })
        .then(function(transactionHash) {
          return responseHelper.successWithData({ transactionHash: transactionHash });
        })
        .catch(function(reason) {
          logger.error('reason', reason);

          return responseHelper.error({
            internal_error_identifier: 't_s_fm_5',
            api_error_identifier: 'something_went_wrong',
            error_config: basicHelper.fetchErrorConfig()
          });
        });
    };

    return asyncTransfer();
  },

  /**
   * Transfer Branded Token
   *
   * @param {string} erc20Address - address of erc20 contract address
   * @param {string} senderAddr - address of user who is sending amount
   * @param {string} senderPassphrase - sender address passphrase
   * @param {string} recipient - address of user who is receiving amount
   * @param {BigNumber} amountInWei - amount which is being transferred in Weis
   *
   * @return {promise<result>}
   */
  transferBrandedToken: function(erc20Address, senderAddr, senderPassphrase, recipient, amountInWei) {
    const oThis = this,
      BrandedTokenKlass = oThis.ic().getBrandedTokenInteractClass(),
      brandedToken = new BrandedTokenKlass({ ERC20: erc20Address });

    return brandedToken.transfer(senderAddr, senderPassphrase, recipient, amountInWei);
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
    const oThis = this,
      SimpleToken = oThis.ic().getSimpleTokenInteractClass(),
      simpleToken = new SimpleToken();

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
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      StPrimeKlass = oThis.ic().getStPrimeInteractClass(),
      stPrimeContractAddress = coreAddresses.getAddressForContract('stPrime'),
      stPrime = new StPrimeKlass(stPrimeContractAddress);

    return stPrime.transfer(senderAddr, senderPassphrase, recipient, amountInWei, {
      returnType: 'txReceipt',
      tag: 'GasRefill'
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
  getEthBalanceOf: function(owner) {
    const oThis = this,
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3Provider = web3ProviderFactory.getProvider('value', 'ws');

    // Validate addresses
    if (!basicHelper.isAddressValid(owner)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 't_s_fm_8',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }

    return web3Provider.eth
      .getBalance(owner)
      .then(function(balance) {
        return responseHelper.successWithData({ balance: balance });
      })
      .catch(function(err) {
        //Format the error
        logger.error(err);
        return responseHelper.error({
          internal_error_identifier: 't_s_fm_9',
          api_error_identifier: 'something_went_wrong',
          error_config: basicHelper.fetchErrorConfig()
        });
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
  getSTPrimeBalanceOf: function(owner) {
    const oThis = this,
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3Provider = web3ProviderFactory.getProvider('utility', 'ws');

    // Validate addresses
    if (!basicHelper.isAddressValid(owner)) {
      let errObj = responseHelper.error({
        internal_error_identifier: 't_s_fm_10',
        api_error_identifier: 'invalid_address',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }

    return web3Provider.eth
      .getBalance(owner)
      .then(function(balance) {
        return responseHelper.successWithData({ balance: balance });
      })
      .catch(function(err) {
        //Format the error
        logger.error(err);

        return responseHelper.error({
          internal_error_identifier: 't_s_fm_11',
          api_error_identifier: 'something_went_wrong',
          error_config: basicHelper.fetchErrorConfig()
        });
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
  getSTBalanceOf: function(owner) {
    const simpleToken = require(rootPrefix + '/lib/contract_interact/simple_token');

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
  getBrandedTokenBalanceOf: function(erc20Address, owner) {
    const BrandedTokenKlass = require(rootPrefix + '/lib/contract_interact/branded_token'),
      brandedToken = new BrandedTokenKlass({ ERC20: erc20Address });

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
  validateEthBalance: function(owner, bigMinAmount) {
    const oThis = this;

    return oThis.getEthBalanceOf(owner).then(function(response) {
      if (response.isFailure()) {
        return response;
      }

      var balance = response.data.balance;
      if (typeof balance === 'undefined' || isNaN(Number(balance))) {
        return responseHelper.error({
          internal_error_identifier: 't_s_fm_6',
          api_error_identifier: 'something_went_wrong',
          error_config: basicHelper.fetchErrorConfig()
        });
      }

      var bigNumBalance = new BigNumber(balance);
      if (bigNumBalance.lessThan(bigMinAmount)) {
        return responseHelper.error({
          internal_error_identifier: 't_s_fm_7',
          api_error_identifier: 'insufficient_funds',
          error_config: basicHelper.fetchErrorConfig()
        });
      }

      return responseHelper.successWithData({ balance: balance, bigNumBalance: bigNumBalance });
    });
  }
};

InstanceComposer.register(FundManagerKlass, 'getSetupFundManager', false);

module.exports = FundManagerKlass;
