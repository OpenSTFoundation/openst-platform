'use strict';
/**
 * Manage openST Platform environment variables
 *
 * @module tools/setup/env_manager
 */

const rootPrefix = '../..',
  setupConfig = require(rootPrefix + '/tools/setup/config'),
  fileManager = require(rootPrefix + '/tools/setup/file_manager'),
  logger = require(rootPrefix + '/helpers/custom_console_logger');

/**
 * Constructor for ENV variables
 *
 * @constructor
 */
const EnvManagerKlass = function() {};

EnvManagerKlass.prototype = {
  /**
   * Generate Config file from config.js and the existing config file
   */
  generateConfigFile: function(purpose) {
    const oThis = this;

    // only create a new file only when purpose is deployment

    if (purpose == 'deployment') {
      logger.info('* generating an empty config strategy file');
      // Create empty ENV file
      fileManager.touch(setupConfig.env_vars_file, '#!/bin/sh');
      fileManager.append(setupConfig.env_vars_file, '#################');
      fileManager.append(setupConfig.env_vars_file, '# opentST Platform Environment file');
      fileManager.append(setupConfig.env_vars_file, '#################');

      // Create empty OpenST Platform Config JSON file
      fileManager.touch(setupConfig.openst_platform_config_file, '{}');
    }

    logger.info('* writing env basic, geth, cache and addresses related env vars');

    // Create geth ENV variables
    oThis._gethVars(purpose);

    // Create cache ENV variables
    oThis._cacheVars();

    // Create notification ENV variables
    oThis._notificationVars();

    // Create miscellaneous ENV variables
    oThis._miscellaneousVars();

    // Create dynamodb ENV variables
    oThis._dynamodbVars();

    // Create dynamodb auto scaling ENV variables
    oThis._dynamodbAutoScalingVars();

    // Create contract address ENV variables
    oThis._contractAddressVars();

    // Create address ENV variables
    oThis._addressVars();
  },

  /**
   * Populate all chains related env variables
   */
  _gethVars: function(purpose) {
    const oThis = this;

    for (var chain in setupConfig.chains) {
      // Add comment to ENV
      fileManager.append(setupConfig.env_vars_file, '\n# ' + chain + ' chain');
      // Add content
      oThis._scanAndPopulatePlatformVars(setupConfig.chains[chain], purpose);
    }
  },

  /**
   * Populate all cache env variables
   */
  _cacheVars: function() {
    const oThis = this;

    // Add comment to ENV
    fileManager.append(setupConfig.env_vars_file, '\n# Cache');

    oThis._scanAndPopulatePlatformVars(setupConfig.cache);
  },

  /**
   * Populate all notification env variables
   */
  _notificationVars: function() {
    const oThis = this;

    // Add comment to ENV
    fileManager.append(setupConfig.env_vars_file, '\n# Notification');

    oThis._scanAndPopulatePlatformVars(setupConfig.notification);
  },

  /**
   * Populate all miscellaneous env variables
   */
  _miscellaneousVars: function() {
    const oThis = this;

    // Add comment to ENV
    fileManager.append(setupConfig.env_vars_file, '\n# Miscellaneous');

    oThis._scanAndPopulatePlatformVars(setupConfig.misc_deployment);
  },

  /**
   * Populate all dynamodb env variables
   */
  _dynamodbVars: function() {
    const oThis = this;

    // Add comment to ENV
    fileManager.append(setupConfig.env_vars_file, '\n# DynamoDB');

    oThis._scanAndPopulatePlatformVars(setupConfig.dynamodb);
  },

  /**
   * Populate all dynamodb auto scaling env variables
   */
  _dynamodbAutoScalingVars: function() {
    const oThis = this;

    // Add comment to ENV
    fileManager.append(setupConfig.env_vars_file, '\n# DynamoDB Auto scaling vars');

    oThis._scanAndPopulatePlatformVars(setupConfig.autoscaling);
  },

  /**
   * Populate all contract address related env variables
   */
  _contractAddressVars: function() {
    const oThis = this;

    // Add comment to ENV
    fileManager.append(setupConfig.env_vars_file, '\n# Contracts');

    for (var address in setupConfig.contracts) {
      oThis._scanAndPopulatePlatformVars(setupConfig.contracts[address]);
    }
  },

  /**
   * Populate all address related env variables
   */
  _addressVars: function() {
    const oThis = this;

    // Add comment to ENV
    fileManager.append(setupConfig.env_vars_file, '\n# Addresses');

    for (var account in setupConfig.addresses) {
      oThis._scanAndPopulatePlatformVars(setupConfig.addresses[account]);
    }
  },

  /**
   * Populate all address related env variables
   *
   * @params {object} data - allowed level is hash of hash, with non-blank "env_var" key and "value" key
   */
  _scanAndPopulatePlatformVars: function(data, purpose) {
    const oThis = this;

    let lData, dataKey, dataVal;

    for (var obj in data) {
      lData = data[obj];
      dataKey = lData.env_var;
      dataVal = lData.value;
      if (typeof lData.env_var !== 'undefined' && lData.env_var.length > 0) {
        if (purpose == 'deployment' && lData.env_var == 'OST_UTILITY_GAS_PRICE') {
          dataVal = '0x0';
        }
        var line = 'export ' + dataKey + "='" + dataVal + "'";
        fileManager.append(setupConfig.env_vars_file, line);
        fileManager.addPlatformConfig(dataKey, dataVal);
        logger.log('Wrote ', dataKey, ' : ', dataVal);
      }
    }
  }
};

module.exports = new EnvManagerKlass();
