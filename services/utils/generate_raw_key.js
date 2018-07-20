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
  , InstanceComposer = require( rootPrefix + '/instance_composer')
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
   *
   * Perform
   *
   * @return {Promise}
   *
   */
  perform: function () {
    const oThis = this
    ;
    
    return oThis.asyncPerform()
      .catch(function (error) {
        if (responseHelper.isCustomResult(error)) {
          return error;
        } else {
          logger.error('openst-platform::services/utils/generate_raw_key.js::perform::catch');
          logger.error(error);
          return responseHelper.error({
            internal_error_identifier: 's_u_grk_1',
            api_error_identifier: 'something_went_wrong',
            debug_options: {}
          });
        }
      });
  },
  
  /**
   * asyncPerform
   *
   * @return {result}
   */
  asyncPerform: async function() {
    const oThis = this
    ;

    const web3Object = new Web3();
    var newAddress = web3Object.eth.accounts.create(web3Object.utils.randomHex(32));

    return responseHelper.successWithData({address: newAddress.address, privateKey: newAddress.privateKey});
  }

};

InstanceComposer.registerShadowableClass(GenerateRawKeyKlass, 'getGenerateRawKeyService');

module.exports = GenerateRawKeyKlass;