'use strict';

/**
 * OpenStStorage Provider
 *
 * @module lib/providers/storage
 */

const OSTStorage = require('@openstfoundation/openst-storage');

const rootPrefix = '../../..',
  InstanceComposer = require(rootPrefix + '/instance_composer');

/**
 * Constructor
 *
 * @constructor
 */
const StorageProviderKlass = function(configStrategy, instanceComposer) {};

StorageProviderKlass.prototype = {
  /**
   * get provider
   *
   * @return {object}
   */
  getInstance: function() {
    const oThis = this,
      configStrategy = oThis.ic().configStrategy;
    return OSTStorage.getInstance(configStrategy);
  }
};

InstanceComposer.register(StorageProviderKlass, 'getStorageProvider', true);

module.exports = StorageProviderKlass;
