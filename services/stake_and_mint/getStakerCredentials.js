"use strict";

/**
 * Get Staker Credentials
 */

const rootPrefix = '../..'
    , coreAddresses = require(rootPrefix + '/config/core_addresses')
    , userName = 'staker'
;

const getStakerCredentials = function () {

  return Promise.resolve({
    'address': coreAddresses.getAddressForUser(userName),
    'passphrase': coreAddresses.getPassphraseForUser(userName)
  });

};

module.exports = getStakerCredentials;