"use strict";

/**
 * Load openST Platform module
 */

const rootPrefix = "."
  , serviceManifest = require(rootPrefix + '/services/manifest')
  , version = require(rootPrefix + '/package.json').version
  , coreAbis = require(rootPrefix + '/config/core_abis')
;

const OpenSTPlatform = function () {
  const oThis = this;

  oThis.version = version;

  oThis.services = serviceManifest;

  oThis.abis = coreAbis;
};

module.exports = new OpenSTPlatform();