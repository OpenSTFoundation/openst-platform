"use strict";

/**
 * Load openST Platform module
 */


const rootPrefix = "."
  , version = require(rootPrefix + '/package.json').version
  , coreAbis = require(rootPrefix + '/config/core_abis')
  , InstanceComposer = require( rootPrefix + "/instance_composer")
;
require(rootPrefix + '/services/manifest')

const OpenSTPlatform = function ( configStrategy ) {
  const oThis = this;

  if ( !configStrategy ) {
    throw "Mandatory argument configStrategy missing";
  }

  const instanceComposer = oThis.ic = new InstanceComposer( configStrategy );

  oThis.version = version;

  oThis.services = instanceComposer.getServiceManifest();

  oThis.abis = coreAbis;

  
};

module.exports = OpenSTPlatform;