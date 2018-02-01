"use strict";
/**
 * Manage openST Platform Services
 *
 * @module tools/setup/service_manager
 */

const shell = require('shelljs')
;

const rootPrefix = "../.."
  , setupConfig = require(rootPrefix + '/tools/setup/config')
  , setupHelper = require(rootPrefix + '/tools/setup/helper')
  , coreConstants = require(rootPrefix + '/config/core_constants')
;

/**
 * Constructor for service manager
 *
 * @constructor
 */
const ServiceManagerKlass = function () {};

ServiceManagerKlass.prototype = {
  /**
   * Start all services for given purpose
   *
   * @params {string} purpose - if mentioned as deployment, geths will start with zero gas. Else in normal mode
   */
  startServices: function (purpose) {
    const oThis = this
      , gasLimit = {utility: coreConstants.OST_UTILITY_GAS_LIMIT, value: coreConstants.OST_VALUE_GAS_LIMIT}
      , zeroGas = parseInt(coreConstants.OST_UTILITY_GAS_PRICE_FOR_DEPLOYMENT, 16);

    // Start geth nodes
    for (var chain in setupConfig.chains) {
      oThis.startGeth(chain, (purpose === 'deployment') ? zeroGas : gasLimit[chain]);
    }

    // Start intercom processes
  },

  /**
   * Stop all services
   */
  stopServices: function () {
    const oThis = this;

    // Stop geth nodes
    for (var chain in setupConfig.chains) {
      oThis.startGeth(chain);
    }

    // Stop intercom processes
  },

  /**
   * Start Geth node
   */
  startGeth: function(chain, gasPrice) {
  },

  /**
   * Start Geth node
   */
  stopGeth: function(chain) {
  }

};

module.exports = new ServiceManagerKlass();
