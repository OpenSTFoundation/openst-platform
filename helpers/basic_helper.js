"use strict";

/**
 * Perform basic validations
 *
 * @module helpers/basic_helper
 */

const rootPrefix = '..'
  , BigNumber = require('bignumber.js')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

const CONVERSION_RATE_DECIMALS = 5;
/**
 * Basic helper methods constructor
 *
 * @constructor
 *
 */
const BasicHelperKlass = function() {};

BasicHelperKlass.prototype = {

  /**
   * Check if address is valid or not
   *
   * @param {string} address - Address
   *
   * @return {boolean}
   */
  isAddressValid: function (address) {
    if (typeof address !== "string") {
      return false;
    }
    return /^0x[0-9a-fA-F]{40}$/.test(address);
  },

  /**
   * Check if uuid is valid or not
   *
   * @param {string} uuid - Branded Token UUID
   *
   * @return {boolean}
   */
  isUuidValid: function (uuid) {
    if (typeof uuid !== "string") {
      return false;
    }
    return /^0x[0-9a-fA-F]{64}$/.test(uuid);
  },

  /**
   * Check if transaction hash is valid or not
   *
   * @param {string} transactionHash - Transaction hash
   *
   * @return {boolean}
   */
  isTxHashValid: function (transactionHash) {
    if (typeof transactionHash !== "string") {
      return false;
    }
    return /^0x[0-9a-fA-F]{64}$/.test(transactionHash);
  },

  /**
   * Check if amount is valid wei number and not zero
   *
   * @param {number} amountInWei - amount in wei
   *
   * @return {boolean}
   */
  isNonZeroWeiValid: function (amountInWei) {
    const oneForMod = new BigNumber('1');

    // Convert amount in BigNumber
    var bigNumAmount = null;
    if (amountInWei instanceof BigNumber) {
      bigNumAmount = amountInWei;
    } else {
      var numAmount = Number(amountInWei);
      if (!isNaN(numAmount)) {
        bigNumAmount = new BigNumber(numAmount);
      }
    }

    return (!bigNumAmount || bigNumAmount.lessThan(1) || bigNumAmount.isNaN() ||
      !bigNumAmount.isFinite() || bigNumAmount.mod(oneForMod) != 0) ? false : true;
  },

  /**
   * Check if tag is valid or not
   *
   * @param {string} tag - transaction tag
   *
   * @return {boolean}
   */
  isTagValid: function (tag) {
    if(tag == ''){
      return true;
    }
    if (typeof tag !== "string") {
      return false;
    }
    return (/^[a-z0-9_\-.]{1,}$/i).test(tag);
  },

  /**
   * get return type for transaction
   *
   * @param {string} returnType - return from geth transactions when following event is received
   *
   * @return {string}
   */
  getReturnType: function (returnType) {
    return ['uuid', 'txHash', 'txReceipt'].includes(returnType) ? returnType : 'txHash';
  },

  /**
   * check if return type is uuid or not
   *
   * @param {string} returnType - return type
   *
   * @return {boolean}
   */
  isReturnTypeUUID: function(returnType) {
    return returnType === 'uuid';
  },

  /**
   * check if return type is txHash or not
   *
   * @param {string} returnType - return type
   *
   * @return {boolean}
   */
  isReturnTypeTxHash: function(returnType) {
    return returnType === 'txHash';
  },

  /**
   * check if return type is txReceipt or not
   *
   * @param {string} returnType - return type
   *
   * @return {boolean}
   */
  isReturnTypeTxReceipt: function(returnType) {
    return returnType === 'txReceipt';
  },

  /**
   * Check if branded token name is valid or not
   *
   * @param {string} name - Branded token name
   *
   * @return {boolean}
   */
  isBTNameValid: function (name) {
    if (typeof name !== "string") {
      return false;
    }
    return (/^[a-z0-9\s]{1,}$/i).test(name);
  },

  /**
   * Check if branded token symbol is valid or not
   *
   * @param {string} symbol - Branded token symbol
   *
   * @return {boolean}
   */
  isBTSymbolValid: function (symbol) {
    if (typeof symbol !== "string") {
      return false;
    }
    return (/^[a-z0-9]{1,}$/i).test(symbol);
  },

  /**
   * Check if branded token conversion rate is valid or not
   *
   * @param {number} conversionRate - Branded token conversion rate
   *
   * @return {boolean}
   */
  isBTConversionRateValid: function (conversionRate) {
    if (isNaN(conversionRate) || (conversionRate % 1) != 0 || parseInt(conversionRate) < 1) {
      return false;
    }
    return true;
  },

  /**
   * Check if branded token conversion factor is valid or not
   *
   * @param {number} conversionFactor - Branded token conversion factor
   *
   * @return {boolean}
   */
  isBTConversionFactorValid: function (conversionFactor) {
    if (isNaN(conversionFactor) || conversionFactor <= 0) {
      return false;
    }
    return true;
  },


  /**
   * Check if branded token conversion rate decimal is valid or not
   *
   * @param {number} conversionRateDecimals - Branded token conversion rate decimals
   *
   * @return {boolean}
   */
  isBTConversionRateDecimalsValid: function (conversionRateDecimals) {
    if (isNaN(conversionRateDecimals) || (conversionRateDecimals % 1) != 0 || parseInt(conversionRateDecimals) < 0 || parseInt(conversionRateDecimals) > 5) {
      return false;
    }
    return true;
  },

  /**
   * Convert wei to proper string. Make sure it's a valid number
   *
   * @param {number} amountInWei - amount in wei to be formatted
   *
   * @return {string}
   */
  formatWeiToString: function (amountInWei) {
    const oThis = this;
    return oThis.convertToBigNumber(amountInWei).toString(10);
  },

  /**
   * Convert number to big number. Make sure it's a valid number
   *
   * @param {number} amountInWei - amount in wei to be formatted
   *
   * @return {BigNumber}
   */
  convertToBigNumber: function (number) {
    return (number instanceof BigNumber) ? number : new BigNumber(number);
  },

  /**
   * Convert conversion factor to conversion rate and conversion rate decimals. Make sure it's a valid number
   *
   * @param {number} conversionFactor - this is decimal number
   *
   * @return {object} - response
   */
  convertConversionFactorToConversionRate: function (conversionFactor) {

    const oThis = this;

    if (!oThis.isBTConversionFactorValid(conversionFactor)) {
      return responseHelper.error('bh_ccftcr_1', 'Conversion factor is invalid');
    }
    const conversionRate = (new BigNumber(String(conversionFactor))).mul((new BigNumber(10)).toPower(CONVERSION_RATE_DECIMALS));
    if (conversionRate.modulo(1).equals(0)){
      return responseHelper.successWithData({conversionRate: conversionRate.toString(10), conversionRateDecimals: CONVERSION_RATE_DECIMALS});      
    } else {
      return responseHelper.error('bh_ccftcr_2', 'Conversion factor is invalid');
    }

  },

  /**
   * Convert conversion rate and conversion rate decimals to conversion factor. Make sure it's a valid number
   *
   * @param {number} conversionRate - this is conversion rate
   * @param {number} conversionRateDecimals - this is conversion rate decimals
   *
   * @return {object} - response
   */
  convertConversionRateToConversionFactor: function (conversionRate, conversionRateDecimals) {
    const oThis = this;
    if (!oThis.isBTConversionRateValid(conversionRate)) {
      return responseHelper.error('bh_ccrtcf_1', 'Conversion rate is invalid');
    }
    
    if (!oThis.isBTConversionRateDecimalsValid(conversionRateDecimals)) {
      return responseHelper.error('bh_ccrtcf_2', 'Conversion rate decimals is invalid');
    }


    const conversionFactor = (new BigNumber(conversionRate)).div((new BigNumber(10)).toPower(conversionRateDecimals))
    return responseHelper.successWithData({conversionFactor: conversionFactor.toString(10)});
  },

  /**
   * Generate a secure random String
   *
   * @param {number} length - length of string to be genrated
   *
   * @return {object} - response
   */
  generateRandomString: function(length) {

    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;

  }

};

module.exports = new BasicHelperKlass();