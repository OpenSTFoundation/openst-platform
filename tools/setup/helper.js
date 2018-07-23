"use strict";
/**
 * Setup Helper
 *
 * @module tools/setup/helper
 */

const shell = require('shelljs')
  , Path = require('path')
  , os = require('os')
;

const rootPrefix = "../.."
  , setupConfig = require(rootPrefix + '/tools/setup/config')
;

/**
 * Setup Helper Constructor
 *
 * @constructor
 */
const SetupHelperKlass = function () {
};

SetupHelperKlass.prototype = {
  /**
   * Create the setup folder
   *
   * @param {object} res - shell response
   *
   */
  handleShellResponse: function (res) {
    if (res.code !== 0) {
      shell.exit(1);
    }
    
    return res;
  },
  
  /**
   * get the setup folder absolute location
   *
   * @return {string}
   *
   */
  setupFolderAbsolutePath: function () {
    const oThis = this;
    return setupConfig.setup_path + "/" + oThis.setupFolder();
  },
  
  /**
   * get the logs folder absolute location
   *
   * @return {string}
   *
   */
  logsFolderAbsolutePath: function () {
    const oThis = this;
    return oThis.setupFolderAbsolutePath() + "/" + oThis.logsFolder();
  },
  
  /**
   * get the bin folder absolute location
   *
   * @return {string}
   *
   */
  binFolderAbsolutePath: function () {
    const oThis = this;
    return oThis.setupFolderAbsolutePath() + "/" + oThis.binFolder();
  },
  
  /**
   * get absolute path of branded token config file
   *
   * @return {string}
   *
   */
  btConfigAbsolutePath: function () {
    const oThis = this;
    return oThis.setupFolderAbsolutePath() + '/branded_tokens.json';
  },
  
  /**
   * get the logs folder name
   *
   * @return {string}
   *
   */
  logsFolder: function () {
    return "logs";
  },
  
  /**
   * get the bin folder name
   *
   * @return {string}
   *
   */
  binFolder: function () {
    return "bin";
  },
  
  /**
   * get the openst-setup folder name
   *
   * @return {string}
   *
   */
  setupFolder: function () {
    return "openst-setup";
  },
  
  /**
   * get list of allowed environments to run setup and token tools
   *
   * @return {array}
   *
   */
  allowedEnvironment: function () {
    return ['development', 'test'];
  },
  
  /**
   * intercom process identifiers
   *
   * @return {array}
   *
   */
  intercomProcessIdentifiers: function () {
    return ["register_branded_token",
      "stake_and_mint", "stake_and_mint_processor"];
  },
  
  /**
   * config strategy file path
   *
   * @return {string}
   *
   */
  configStrategyFilePath: function () {
    
    const oThis = this;
    return oThis.setupFolderAbsolutePath() + '/' + setupConfig.openst_platform_config_file
    
  }
  
};

module.exports = new SetupHelperKlass();
