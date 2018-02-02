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

    // Remove old test folder
    oThis.rm('');

    // Create new test folder
    oThis.mkdir('');
  },

  /**
   * Delete file/folder inside openST test environment
   *
   * @param {string} relativePath - relative file/folder path
   */
  rm: function(relativePath) {
    const folder = setupHelper.testFolderAbsolutePath() + '/' + relativePath;
    return setupHelper.handleShellResponse(shell.exec('rm -rf ' + folder));
  },

  /**
   * Create folder inside openST test environment
   *
   * @param {string} relativePath - relative folder path
   */
  mkdir: function(relativePath) {
    const folder = setupHelper.testFolderAbsolutePath() + '/' + relativePath;
    return setupHelper.handleShellResponse(shell.exec('mkdir ' + folder));
  },

  /**
   * Create file inside openST test environment
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
   * Copy file from one folder to another inside openST test environment
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
