"use strict";

/**
 * Generate raw private key
 *
 * @module services/utils/generate_raw_key
 */

const rootPrefix = '../..'
  , Web3 = require('web3')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

/**
 * Constructor to generate a raw private key and address
 *
 * @constructor
 */
const GenerateRawKeyKlass = function () {
  const oThis = this
  ;
};

GenerateRawKeyKlass.prototype = {
  /**
   * Perform<br><br>
   *
   * @return {result}
   */
  perform: function () {
    const oThis = this
    ;

    const web3Object = new Web3();
    var newAddress = web3Object.eth.accounts.create(web3Object.utils.randomHex(32));

    return responseHelper.successWithData({address: newAddress.address, privateKey: newAddress.privateKey});
  }

};

module.exports = GenerateRawKeyKlass;