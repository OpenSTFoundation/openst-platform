"use strict";

/**
 * Generate new address
 *
 * @module services/utils/generate_address
 */

const rootPrefix = '../..'
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

/**
 * Constructor for generate address
 *
 * @param {object} params - this is object with keys - passphrase, chain
 *
 * @constructor
 */
const GenerateAddressKlass = function (params) {
  const oThis = this
  ;

  oThis.passphrase = params.passphrase;
  oThis.chain = params.chain;
};

GenerateAddressKlass.prototype = {
  /**
   * Perform<br><br>
   *
   * @return {promise<result>} - returns a promise which resolves to an object of kind Result
   */
  perform: async function() {
    const oThis = this
    ;

    const web3Provider = web3ProviderFactory.getProvider(oThis.chain, web3ProviderFactory.typeRPC);
    if(!web3Provider) {
      // this is a error scenario.
      return Promise.resolve(responseHelper.error('s_u_ga_1', 'Invalid chain'));
    }

    var eth_address = await web3Provider.eth.personal.newAccount(oThis.passphrase);

    // returns a promise which resolves to an address which was created.
    return Promise.resolve(responseHelper.successWithData({address: eth_address}));
  }

};

module.exports = GenerateAddressKlass;