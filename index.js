"use strict";

/**
 * Load openST Platform module
 */

const rootPrefix = "."
  , serviceManifest = require(rootPrefix + '/services/manifest')
  , version = require(rootPrefix + '/package.json').version
  , BrandedTokenKlass = require(rootPrefix + "/lib/contract_interact/branded_token")
;

const OpenSTPlatform = function () {
  const oThis = this;

  oThis.version = version;

  oThis.contracts = {};
  oThis.contracts.brandedToken = BrandedTokenKlass;

  oThis.services = serviceManifest;
};

module.exports = new OpenSTPlatform();