'use strict';
/**
 * Setup Helper
 *
 * @module tools/setup/start_services_helper
 */

const shell = require('shelljs');

const rootPrefix = '../..',
  setupConfig = require(rootPrefix + '/tools/setup/config');

/**
 * Start Services Helper Constructor
 *
 * @constructor
 */
const StartServicesHelperKlass = function() {};

StartServicesHelperKlass.prototype = {
  /**
   * get the openst-setup folder name
   *
   * @return {string}
   *
   */
  setupFolder: function() {
    return 'openst-setup';
  },

  /**
   * get the bin folder name
   *
   * @return {string}
   *
   */
  binFolder: function() {
    return 'bin';
  },

  /**
   * get the setup folder absolute location
   *
   * @return {string}
   *
   */
  setupFolderAbsolutePath: function() {
    const oThis = this;
    return setupConfig.setup_path + '/' + oThis.setupFolder();
  },

  /**
   * intercomm data file folder
   *
   * @return {string}
   */
  utilityChainBinFilesFolder: function(utilityChainId) {
    const oThis = this;

    return oThis.binFolder() + '/' + 'utility-chain-' + utilityChainId;
  },

  /**
   * get list of allowed environments to run setup and token tools
   *
   * @return {array}
   *
   */
  allowedEnvironment: function() {
    return ['development', 'test'];
  },

  /**
   * config strategy file path
   *
   * @return {string}
   *
   */
  configStrategyFilePath: function() {
    const oThis = this;
    return oThis.setupFolderAbsolutePath() + '/' + setupConfig.openst_platform_config_file;
  }
};

module.exports = new StartServicesHelperKlass();
