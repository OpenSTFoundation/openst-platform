"use strict";
/**
 * Branded Token related tools helper file
 *
 * @module tools/setup/branded_token/helper
 */

const fs = require('fs')
  , shell = require('shelljs')
;

const rootPrefix = '../../..'
  , setupHelper = require(rootPrefix + '/tools/setup/helper')
;

/**
 * Constructor for helper class
 *
 * @constructor
 */
const HelperKlass = function () {
};

HelperKlass.prototype = {
  /**
   * Get a specific branded token or all branded token details
   *
   * @params {string} uuid - Branded Token uuid to get the details. If not passed, all branded tokens will be returned.
   *
   * @return {promise<object>} - branded tokens list
   */
  getBrandedToken: function (uuid) {
    const oThis = this;
    return oThis._readJsonFile(setupHelper.btConfigAbsolutePath());
  },
  
  /**
   * Add new branded tokens
   *
   * @params {object} brandedTokens - Details of all branded tokens to be updated in json file
   *
   * @return {promise<object>} - branded tokens list
   */
  addBrandedToken: function (brandedTokens) {
    const oThis = this;
    return oThis._writeJsonFile(setupHelper.btConfigAbsolutePath(), brandedTokens);
  },
  
  /**
   * Read JSON file
   *
   * @params {string} jsonFilePath - path of json file to read
   *
   * @return {promise<object>} - branded tokens list
   * @private
   */
  _readJsonFile: function (jsonFilePath) {
    return new Promise(function (onResolve, onReject) {
      fs.readFile(jsonFilePath, function (err, data) {
        if (err) {
          if (err.code === 'ENOENT') {
            data = "{}";
            shell.exec('echo "' + data + '" > ' + jsonFilePath)
          } else {
            throw err;
          }
        }
        return onResolve(JSON.parse(data));
      });
    });
  },
  
  /**
   * Write content to JSON file
   *
   * @params {string} jsonFilePath - path of json file to read
   * @params {object} jsonContent - content to be written in JSON file
   *
   * @return {promise<object>} - branded tokens list
   * @private
   */
  _writeJsonFile: function (jsonFilePath, jsonContent) {
    return new Promise(function (onResolve, onReject) {
      var humanReadableContent = JSON.stringify(jsonContent, null, 2);
      fs.writeFile(jsonFilePath, humanReadableContent, function (err) {
        if (err) throw err;
        return onResolve(JSON.parse(humanReadableContent));
      });
    });
  },
};

module.exports = new HelperKlass();
