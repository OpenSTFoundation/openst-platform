"use strict";

/**
 * Address related services.
 */

const rootPrefix = '..'
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  ;

const address = {
  // creates an address with keystore file on the correct chain, using the passphrase which is given in params.
  create: function (chain, passphrase) {

    const web3Provider = web3ProviderFactory.getProvider(chain, web3ProviderFactory.typeRPC);
    if(!web3Provider) {
      // this is a error scenario.
      return Promise.reject('Invalid chain.');
    }

    // returns a promise which resolves to an address which was created.
    return web3Provider.eth.personal.newAccount(passphrase);
  }
};

module.exports = address;