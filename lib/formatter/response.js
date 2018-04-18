"use strict";

/**
 * Response formatter
 *
 * @module lib/formatter/response
 */

const shortId = require('shortid')
;

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

/**
 * @ignore
 */
function Result(data, errCode, errMsg) {
  this.success = (typeof errCode === "undefined");

  this.data = data || {};

  if (!this.success) {
    this.err = {
      code: errCode,
      msg: errMsg
    };
  }

  // Check if response has success
  this.isSuccess = function () {
    return this.success;
  };

  // Check if response is not success. More often not success is checked, so adding a method.
  this.isFailure = function () {
    return !this.isSuccess();
  };
}

/**
 * Response Helper
 *
 * @constructor
 */
const ResponseHelperKlass = function () {
};

ResponseHelperKlass.prototype = {
  /**
   * Generate success response object<br><br>
   *
   * @return {result}
   *
   */
  successWithData: function (data) {
    return new Result(data);
  },

  /**
   * Generate error response object<br><br>
   *
   * @return {result}
   *
   */
  error: function (errCode, errMsg, errPrefix) {
    errCode = 'ost_platform(' + errCode + ":" + shortId.generate() + ')';
    if (errPrefix) {
      errCode = errPrefix + "*" + errCode;
    }
    logger.error('### Error ### ' + errCode + ' ###');
    logger.error('### Error MSG ### ' + errMsg + ' ###');
    return new Result({}, errCode, errMsg);
  },

  /**
   * return true if the object passed is of Result class
   *
   * @param {object} obj - object to check instanceof
   *
   * @return {bool}
   */
  isCustomResult: function (obj) {
    return obj instanceof Result
  }
};

module.exports = new ResponseHelperKlass();
