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
   * Do the old setup clean up
   */
  freshSetup: function() {
    const oThis = this;

    // Remove old setup folder
    logger.info('* Deleting old openST setup folder');
    oThis.rm('');

    // Create new setup folder
    logger.info('* Creating new openST setup folder');
    oThis.mkdir('');

    // Create logs setup folder
    logger.info('* Creating openST setup logs folder');
    oThis.mkdir(setupHelper.logsFolder());

    // Create intercom data files in logs folder
    logger.info('* Creating openST intercom data files');
    const intercomProcessIdentifiers = setupHelper.intercomProcessIdentifiers();
    for (var i = 0; i < intercomProcessIdentifiers.length; i++) {
      oThis.touch(
        'logs/' + intercomProcessIdentifiers[i] + '.data',
        '{\\"lastProcessedBlock\\":0,\\"lastProcessedTransactionIndex\\":0}'
      );
    }

    // Create bin setup folder
    logger.info('* Creating openST setup bin folder');
    oThis.mkdir(setupHelper.binFolder());

    // Create empty ENV file
    logger.info('* Create empty ENV file');
    oThis.touch(setupConfig.env_vars_file, '#!/bin/sh');

    // Create empty OpenST Platform JSON Config File.
    logger.info('* Create empty ENV file');
    oThis.touch(setupConfig.openst_platform_config_file, '{}');
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
   *
   * @param {string} configKey - Config Key
   * @param {string} configValue - Config Value
   */
  getPlatformConfig: function(configKey, configValue) {
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
  }
};

module.exports = new FileManagerKlass();
