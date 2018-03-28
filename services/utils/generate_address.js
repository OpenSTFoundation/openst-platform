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
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

/**
 * Constructor to generate a new address
 *
 * @param {object} params
 * @param {string} params.chain - Chain on which this new address should be generated and stored
 * @param {string} [params.passphrase] - Passphrase for the new address. Default: blank
 *
 * @constructor
 */
const GenerateAddressKlass = function (params) {
  const oThis = this
  ;

  params = params || {};
  oThis.passphrase = params.passphrase || '';
  oThis.chain = params.chain;
};

GenerateAddressKlass.prototype = {
  /**
   * Perform<br><br>
   *
   * @return {promise<result>}
   */
  perform: async function() {
    const oThis = this
    ;

    const web3Provider = web3ProviderFactory.getProvider(oThis.chain, web3ProviderFactory.typeWS);
    if(!web3Provider) {
      return Promise.resolve(responseHelper.error('s_u_ga_1', 'Invalid chain'));
    }

    var eth_address = await web3Provider.eth.personal.newAccount(oThis.passphrase);

    // returns a promise which resolves to an address which was created.
    return Promise.resolve(responseHelper.successWithData({address: eth_address}));
  }

};

module.exports = GenerateAddressKlass;