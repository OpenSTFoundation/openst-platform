"use strict";
/**
 * Manage openST Platform Setup files/folders
 *
 * @module tools/setup/file_manager
 */

const shell = require('shelljs')
;

const rootPrefix = "../.."
  , setupConfig = require(rootPrefix + '/tools/setup/config')
  , setupHelper = require(rootPrefix + '/tools/setup/helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

/**
 * Constructor for file manager
 *
 * @constructor
 */
const FileManagerKlass = function () {};

FileManagerKlass.prototype = {
  /**
   * Do the old setup clean up
   */
  freshSetup: function() {
    const oThis = this;

    // Remove old setup folder
    logger.info("* Deleting old openST setup folder");
    oThis.rm('');

    // Create new setup folder
    logger.info("* Creating new openST setup folder");
    oThis.mkdir('');
  },

  /**
   * Delete file/folder inside openST setup environment
   *
   * @param {string} relativePath - relative file/folder path
   */
  rm: function(relativePath) {
    const folder = setupHelper.testFolderAbsolutePath() + '/' + relativePath;
    return setupHelper.handleShellResponse(shell.exec('rm -rf ' + folder));
  },

  /**
   * Create folder inside openST setup environment
   *
   * @param {string} relativePath - relative folder path
   */
  mkdir: function(relativePath) {
    const folder = setupHelper.testFolderAbsolutePath() + '/' + relativePath;
    return setupHelper.handleShellResponse(shell.exec('mkdir ' + folder));
  },

  /**
   * Create file inside openST setup environment
   *
   * @param {string} relativePath - relative file path
   * @param {string} fileContent - optional file content
   */
  touch: function(relativePath, fileContent) {
    const file = setupHelper.testFolderAbsolutePath() + '/' + relativePath;
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
    const file = setupHelper.testFolderAbsolutePath() + '/' + relativePath;
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
    const src = setupHelper.testFolderAbsolutePath() + '/' + fromFolder + '/' + fileName
      , dest = setupHelper.testFolderAbsolutePath() + '/' + toFolder + '/';
    return setupHelper.handleShellResponse(shell.exec('cp -r ' + src + ' ' + dest));
  },

  /**
   * Execute any shell command command
   *
   * @param {string} command - raw command
   */
  exec: function(command) {
    return setupHelper.handleShellResponse(shell.exec(command));
  }

};

module.exports = new FileManagerKlass();
