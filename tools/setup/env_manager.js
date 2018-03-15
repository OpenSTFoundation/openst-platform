"use strict";
/**
 * Manage openST Platform environment variables
 *
 * @module tools/setup/env_manager
 */
const rootPrefix = "../.."
  , setupConfig = require(rootPrefix + '/tools/setup/config')
  , fileManager = require(rootPrefix + '/tools/setup/file_manager')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

/**
 * Constructor for ENV variables
 *
 * @constructor
 */
const EnvManagerKlass = function () {};

EnvManagerKlass.prototype = {
  /**
   * Generate ENV file from config.js
   */
  generateEnvFile: function() {
    const oThis = this;

    // Create empty ENV file
    fileManager.touch(setupConfig.env_vars_file, '#!/bin/sh');
    fileManager.append(setupConfig.env_vars_file, '#################');
    fileManager.append(setupConfig.env_vars_file, '# opentST Platform Environment file');
    fileManager.append(setupConfig.env_vars_file, '#################');

    logger.info('* writing env basic, geth, cache and addresses related env vars');

    // Create geth ENV variables
    oThis._gethVars();

    // Create cache ENV variables
    oThis._cacheVars();

    // Create notification ENV variables
    oThis._notificationVars();

    // Create miscellaneous ENV variables
    oThis._miscellaneousVars();

    // Create contract address ENV variables
    oThis._contractAddressVars();

    // Create address ENV variables
    oThis._addressVars();
  },

  /**
   * Populate all chains related env variables
   */
  _gethVars: function () {
    const oThis = this;

    for (var chain in setupConfig.chains) {
      // Add comment to ENV
      fileManager.append(setupConfig.env_vars_file, "\n# "+chain+" chain");
      // Add content
      oThis._scanAndPopulateEnvVars(setupConfig.chains[chain]);
    }
  },

  /**
   * Populate all cache env variables
   */
  _cacheVars: function () {
    const oThis = this;

    // Add comment to ENV
    fileManager.append(setupConfig.env_vars_file, "\n# Cache");

    oThis._scanAndPopulateEnvVars(setupConfig.cache);
  },

  /**
   * Populate all notification env variables
   */
  _notificationVars: function () {
    const oThis = this;

    // Add comment to ENV
    fileManager.append(setupConfig.env_vars_file, "\n# Notification");

    oThis._scanAndPopulateEnvVars(setupConfig.notification);
  },

  /**
   * Populate all miscellaneous env variables
   */
  _miscellaneousVars: function () {
    const oThis = this;

    // Add comment to ENV
    fileManager.append(setupConfig.env_vars_file, "\n# Miscellaneous");

    oThis._scanAndPopulateEnvVars(setupConfig.misc_deployment);
  },

  /**
   * Populate all contract address related env variables
   */
  _contractAddressVars: function () {
    const oThis = this;

    // Add comment to ENV
    fileManager.append(setupConfig.env_vars_file, "\n# Contracts");

    for (var address in setupConfig.contracts) {
      oThis._scanAndPopulateEnvVars(setupConfig.contracts[address]);
    }
  },

  /**
   * Populate all address related env variables
   */
  _addressVars: function () {
    const oThis = this;

    // Add comment to ENV
    fileManager.append(setupConfig.env_vars_file, "\n# Addresses");

    for (var account in setupConfig.addresses) {
      oThis._scanAndPopulateEnvVars(setupConfig.addresses[account]);
    }
  },

  /**
   * Populate all address related env variables
   *
   * @params {object} data - allowed level is hash of hash, with non-blank "env_var" key and "value" key
   */
  _scanAndPopulateEnvVars: function (data) {
    const oThis = this;

    for (var obj in data) {
      var lData = data[obj];
      if (typeof lData.env_var !== 'undefined' && lData.env_var.length > 0) {
        var line = "export " + lData.env_var + "='" + lData.value + "'";
        fileManager.append(setupConfig.env_vars_file, line);
      }
    }
  },

};

module.exports = new EnvManagerKlass();
