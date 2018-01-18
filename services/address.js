"use strict";

/**
 * Address related services.
 */

const rootPrefix = '..'
  ;

const address = {
  // creates an address with keystore file on the correct chain, using the passphrase which is given in params.
  create: function (chain, passphrase) {
    var web3RpcProvider = null;
    if (chain == 'utility') {
      web3RpcProvider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
    } else {
      web3RpcProvider = require(rootPrefix + '/lib/web3/providers/value_rpc')
    }

    // returns a promise which resolves to an address which was created.
    return web3RpcProvider.eth.personal.newAccount(passphrase);
  }
};

module.exports = address;