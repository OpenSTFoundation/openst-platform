'use strict';
/**
 * Setup Helper
 *
 * @module tools/setup/helper
 */

const shell = require('shelljs'),
  Path = require('path'),
  os = require('os');

const rootPrefix = '../..',
  setupConfig = require(rootPrefix + '/tools/setup/config');

/**
 * Setup Helper Constructor
 *
 * @constructor
 */
const SetupHelperKlass = function() {};

SetupHelperKlass.prototype = {
  /**
   * Create the setup folder
   *
   * @param {object} res - shell response
   *
   */
  handleShellResponse: function(res) {
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
  setupFolderAbsolutePath: function() {
    const oThis = this;
    return setupConfig.setup_path + '/' + oThis.setupFolder();
  },

  /**
   * get the logs folder absolute location
   *
   * @return {string}
   *
   */
  logsFolderAbsolutePath: function() {
    const oThis = this;
    return oThis.setupFolderAbsolutePath() + '/' + oThis.logsFolder();
  },

  /**
   * get the bin folder absolute location
   *
   * @return {string}
   *
   */
  binFolderAbsolutePath: function() {
    const oThis = this;
    return oThis.setupFolderAbsolutePath() + '/' + oThis.binFolder();
  },

  /**
   * get absolute path of branded token config file
   *
   * @return {string}
   *
   */
  btConfigAbsolutePath: function() {
    const oThis = this;
    return oThis.setupFolderAbsolutePath() + '/branded_tokens.json';
  },

  /**
   * get the data folder name
   *
   * @return {string}
   *
   */
  dataFolder: function() {
    return 'data';
  },

  /**
   * get the logs folder name
   *
   * @return {string}
   *
   */
  logsFolder: function() {
    return 'logs';
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
   * get the config folder name
   *
   * @return {string}
   *
   */
  configFolder: function() {
    return 'config';
  },

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
   * master GETH folder
   *
   * @return {string}
   *
   */
  masterGethFolder: function() {
    return 'all-geths';
  },

  /**
   * GETH folder for a particular chain
   *
   * @param {string} chain
   * @return {string}
   *
   */
  gethFolderFor: function(chain) {
    const oThis = this;

    let folderName = setupConfig.chains[chain].folder_name;

    folderName = folderName + '-' + oThis.chainIdFor(chain);

    return oThis.masterGethFolder() + '/' + folderName;
  },

  /**
   * Config file path for a chain
   *
   * @param {string} chain
   * @return {string}
   *
   */
  configFilePathFor: function(chain) {
    const oThis = this;

    return oThis.configFolder() + '/' + chain + '-' + oThis.chainIdFor(chain) + '.json';
  },
  /**
   * chain id for a particular chain
   *
   * @param {string} chain
   * @return {number}
   */
  chainIdFor: function(chain) {
    const oThis = this;

    if (chain === 'value') {
      return oThis.valueChainId();
    } else {
      return oThis.utilityChainId();
    }
  },

  /**
   * utility chain id
   *
   * @return {number}
   */
  utilityChainId: function() {
    return setupConfig.chains.utility.chain_id.value;
  },

  /**
   * value chain id
   *
   * @return {number}
   */
  valueChainId: function() {
    return setupConfig.chains.value.chain_id.value;
  },

  /**
   * utility chain logs files folder
   *
   * @return {number}
   */
  utilityChainLogsFilesFolder: function() {
    const oThis = this;

    return oThis.logsFolder() + '/' + 'utility-chain-' + oThis.utilityChainId();
  },

  /**
   * utility chain data files folder
   *
   * @return {number}
   */
  utilityChainDataFilesFolder: function() {
    const oThis = this;

    return oThis.dataFolder() + '/' + 'utility-chain-' + oThis.utilityChainId();
  },

  /**
   * intercomm data file folder
   *
   * @return {number}
   */
  utilityChainBinFilesFolder: function() {
    const oThis = this;

    return oThis.binFolder() + '/' + 'utility-chain-' + oThis.utilityChainId();
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
   * intercom process identifiers
   *
   * @return {array}
   *
   */
  intercomProcessIdentifiers: function() {
    return ['register_branded_token', 'stake_and_mint', 'stake_and_mint_processor'];
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
  },

  configStrategyUtilityFilePath: function() {
    const oThis = this;
    return (
      oThis.setupFolderAbsolutePath() +
      '/' +
      oThis.utilityChainBinFilesFolder() +
      '/' +
      setupConfig.openst_platform_config_file
    );
  },

  /**
   * allocated addresses file path
   *
   * @return {string}
   */
  allocatedAddressFilePath: function() {
    const oThis = this;
    return oThis.setupFolderAbsolutePath() + '/' + setupConfig.allocated_addresses_file_path;
  }
};

module.exports = new SetupHelperKlass();
