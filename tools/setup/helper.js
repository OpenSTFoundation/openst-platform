"use strict";
/**
 * Setup Helper
 *
 * @module tools/setup/helper
 */

const shell = require('shelljs')
  , Path = require('path')
;

const rootPrefix = "../.."
  , setupConfig = require(rootPrefix + '/tools/setup/config')
;

/**
 * Setup Helper Constructor
 *
 * @constructor
 */
const SetupHelperKlass = function () {};

SetupHelperKlass.prototype = {
  /**
   * Create the test folder
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

  testFolderAbsolutePath: function() {
    return Path.join(__dirname, rootPrefix + '/' +setupConfig.test_folder + '/');
  }
};

module.exports = new SetupHelperKlass();



