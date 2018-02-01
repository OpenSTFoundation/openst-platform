"use strict";
/**
 * Geth process setup
 *
 * @module tools/setup/geth_manager
 */

const shell = require('shelljs')
;

const rootPrefix = "../.."
  , setupConfig = require(rootPrefix + '/tools/setup/config')
  , setupHelper = require(rootPrefix + '/tools/setup/helper')
  , fileManager = require(rootPrefix + '/tools/setup/file_manager')
;

const tempGethFolder = 'tmp-geth'
;

/**
 * Constructor for geth manager
 *
 * @constructor
 */
const GethManagerKlass = function () {};

GethManagerKlass.prototype = {

  /**
   * Generate all required addresses in temp geth data dir
   *
   * @return {object} - name to address map
   */
  generateConfigAddresses: function() {
    const oThis = this
      , nameToAddrMap = {};

    // create temp geth folder
    fileManager.mkdir(tempGethFolder);

    // create all required addresses in tmp geth data dir
    for (var name in setupConfig.addresses) {
      var nameDetails = setupConfig.addresses[name];
      nameToAddrMap[name] = oThis.generateAddress(tempGethFolder, nameDetails.passphrase);
    }

    return nameToAddrMap;
  },


  /**
   * Generate keystore in required data dir
   *
   * @param {string} relativeDataDir - relative geth data dir path
   * @param {string} passphrase - account passphrase
   *
   * @return {string} - new account address
   */
  generateAddress: function(relativeDataDir, passphrase) {
    const tmpPasswordFilePath = relativeDataDir + '/tmp_password_file'
      , absoluteDirPath = setupHelper.testFolderAbsolutePath() + relativeDataDir;

    // creating password file in a temp location
    fileManager.touch(tmpPasswordFilePath, passphrase);

    // generate keystore file and address
    const cmd = 'geth --datadir "' + absoluteDirPath + '" account new --password ' +
      setupHelper.testFolderAbsolutePath() + tmpPasswordFilePath;
    var addressGerationResponse = fileManager.exec(cmd);

    // remove password
    fileManager.rm(tmpPasswordFilePath);

    // parsing the response to get address
    return addressGerationResponse.stdout.replace("Address: {", "0x").replace("}","").trim();
  }
};

module.exports = new GethManagerKlass();



