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
    return Path.resolve("./") + "/" + setupConfig.setup_folder;
  }
};

module.exports = new SetupHelperKlass();
