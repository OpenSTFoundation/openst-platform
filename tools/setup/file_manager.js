'use strict';
/**
 * Manage openST Platform Setup files/folders
 *
 * @module tools/setup/file_manager
 */

const shell = require('shelljs'),
  fs = require('fs');

const rootPrefix = '../..',
  setupConfig = require(rootPrefix + '/tools/setup/config'),
  setupHelper = require(rootPrefix + '/tools/setup/helper'),
  logger = require(rootPrefix + '/helpers/custom_console_logger');

/**
 * Constructor for file manager
 *
 * @constructor
 */
const FileManagerKlass = function() {};

FileManagerKlass.prototype = {
  /**
   * Fresh setup
   */
  freshSetup: function() {
    const oThis = this;

    // Remove old setup folder
    logger.info('* Deleting old openST setup folder');
    oThis.rm('');

    // Create new setup folder
    logger.info('* Creating new openST setup folder');
    oThis.mkdir('');

    // Creating logs folder
    logger.info('* Creating logs folder');
    oThis.mkdir(setupHelper.logsFolder());

    // Creating bin folder
    logger.info('* Creating bin folder');
    oThis.mkdir(setupHelper.binFolder());

    // Creating data folder
    logger.info('* Creating data folder');
    oThis.mkdir(setupHelper.dataFolder());

    // Creating config folder
    logger.info('* Creating config folder');
    oThis.mkdir(setupHelper.configFolder());

    // Create master GETH folder
    logger.info('* Creating master GETH folder');
    oThis.mkdir(setupHelper.masterGethFolder());

    // Create empty ENV file
    logger.info('* Create empty ENV file');
    oThis.touch(setupConfig.env_vars_file, '#!/bin/sh');

    // Create empty OpenST Platform JSON Config File.
    logger.info('* Create empty ENV file');
    oThis.touch(setupConfig.openst_platform_config_file, '{}');
  },

  /**
   * Utility chain folders setup
   */
  utilityChainFoldersSetup: function() {
    const oThis = this;

    // Create intercom data files in logs folder
    logger.info('* Creating utility chain specific logs folder');
    oThis.mkdir(setupHelper.utilityChainLogsFilesFolder());

    logger.info('* Creating utility chain specific data folder');
    oThis.mkdir(setupHelper.utilityChainDataFilesFolder());

    // Create intercom data files in logs folder
    logger.info('* Creating openST intercom data files');
    const intercomProcessIdentifiers = setupHelper.intercomProcessIdentifiers();
    for (let i = 0; i < intercomProcessIdentifiers.length; i++) {
      oThis.touch(
        setupHelper.utilityChainDataFilesFolder() + '/' + intercomProcessIdentifiers[i] + '.data',
        '{\\"lastProcessedBlock\\":0,\\"lastProcessedTransactionIndex\\":0}'
      );
    }

    // Create utility chain bin folder
    logger.info('* Creating utility chain bin folder');
    oThis.mkdir(setupHelper.utilityChainBinFilesFolder());
  },

  /**
   * Delete file/folder inside openST setup environment
   *
   * @param {string} relativePath - relative file/folder path
   */
  rm: function(relativePath) {
    const folder = setupHelper.setupFolderAbsolutePath() + '/' + relativePath;
    return setupHelper.handleShellResponse(shell.exec('rm -rf ' + folder));
  },

  /**
   * Create folder inside openST setup environment
   *
   * @param {string} relativePath - relative folder path
   */
  mkdir: function(relativePath) {
    const folder = setupHelper.setupFolderAbsolutePath() + '/' + relativePath;
    return setupHelper.handleShellResponse(shell.exec('mkdir ' + folder));
  },

  /**
   * Create file inside openST setup environment
   *
   * @param {string} relativePath - relative file path
   * @param {string} fileContent - optional file content
   */
  touch: function(relativePath, fileContent) {
    const file = setupHelper.setupFolderAbsolutePath() + '/' + relativePath;
    fileContent = fileContent || '';
    return setupHelper.handleShellResponse(shell.exec('echo "' + fileContent + '" > ' + file));
  },

  /**
   * Append line at the end of the file
   *
   * @param {string} relativePath - relative file path
   * @param {string} line - line to be appended to file
   */
  append: function(relativePath, line) {
    const file = setupHelper.setupFolderAbsolutePath() + '/' + relativePath;
    return setupHelper.handleShellResponse(shell.exec('echo "' + line + '" >> ' + file));
  },

  /**
   * Copy file from one folder to another inside openST setup environment
   *
   * @param {string} fromFolder - relative from folder
   * @param {string} toFolder - relative to folder
   * @param {string} fileName - file name
   */
  cp: function(fromFolder, toFolder, fileName) {
    const src = setupHelper.setupFolderAbsolutePath() + '/' + fromFolder + '/' + fileName,
      dest = setupHelper.setupFolderAbsolutePath() + '/' + toFolder + '/';
    return setupHelper.handleShellResponse(shell.exec('cp -r ' + src + ' ' + dest));
  },

  /**
   * Execute any shell command command
   *
   * @param {string} command - raw command
   */
  exec: function(command) {
    return setupHelper.handleShellResponse(shell.exec(command));
  },

  /**
   * Load OpenST Platform Config
   */
  getPlatformConfig: function() {
    const filePath = setupHelper.configStrategyFilePath();

    // Read Config
    let content = fs.readFileSync(filePath),
      config = JSON.parse(content);

    return config;
  },

  /**
   * Add Configuration to OpenST Platform JSON Config File
   *
   * @param {string} configKey - Config Key
   * @param {string} configValue - Config Value
   */
  addPlatformConfig: function(configKey, configValue) {
    if (configValue == '') {
      return;
    }
    const filePath = setupHelper.configStrategyFilePath();

    // Read Config
    let content = fs.readFileSync(filePath),
      config = JSON.parse(content);

    // Update the config.
    config[configKey] = configValue;
    content = JSON.stringify(config, null, 2);

    // Write Config
    fs.writeFileSync(filePath, content);
  },

  /**
   * Create allocated addresses file
   *
   * @param {object} allocatedAddresses
   */
  createAllocatedAddressFile: function(allocatedAddresses) {
    const filePath = setupHelper.allocatedAddressFilePath();
    let content = JSON.stringify(allocatedAddresses, null, 2);
    fs.writeFileSync(filePath, content);
  },

  /**
   * get allocated addresses from file
   *
   * @return {object} allocatedAddresses
   */
  getAllocatedAddresses: function() {
    const filePath = setupHelper.allocatedAddressFilePath();

    let content = fs.readFileSync(filePath),
      allocatedAddresses = JSON.parse(content);

    return allocatedAddresses;
  }
};

module.exports = new FileManagerKlass();
