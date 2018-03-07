"use strict";

/**
 * Generate new address
 *
 * @module services/utils/generate_unlocked_address
 */

const rootPrefix = '../..'
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

/**
 * Constructor to generate a new address and return unlocked private key
 *
 * @param {object} params
 * @param {string} params.chain - Chain on which this new address should be generated and stored
 * @param {string} [params.passphrase] - Passphrase for the new address. Default: blank
 *
 * @constructor
 */
const GenerateUnlockedAddressKlass = function (params) {
  const oThis = this
  ;

  params = params || {};
  oThis.passphrase = params.passphrase || '';
  oThis.chain = params.chain;
};

GenerateUnlockedAddressKlass.prototype = {
  /**
   * Perform<br><br>
   *
   * @return {promise<result>}
   */
  perform: function() {
    const oThis = this
    ;

    const web3Provider = web3ProviderFactory.getProvider(oThis.chain, web3ProviderFactory.typeRPC);
    if(!web3Provider) {
      return Promise.resolve(responseHelper.error('s_u_gua_1', 'Invalid chain'));
    }

    var newAddress = web3Provider.eth.accounts.create(oThis.passphrase);

    // returns a promise which resolves to an address which was created.
    return Promise.resolve(responseHelper.successWithData({address: newAddress.address, privateKey: newAddress.privateKey}));
  }

};

module.exports = GenerateUnlockedAddressKlass;