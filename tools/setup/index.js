"use strict";
/**
 * Start the OpenST Setup
 */

const rootPrefix = "../.."
  , setupConfig = require(rootPrefix + '/tools/setup/config')
  , fileManager = require(rootPrefix + '/tools/setup/file_manager')
  , gethManager = require(rootPrefix + '/tools/setup/geth_manager')
;

const performer = async function () {

  // Remove test folder
  fileManager.rm('');

  // Create test folder
  fileManager.mkdir('');

  // generate all required addresses
  const nameToAddrMap = gethManager.generateConfigAddresses();

  // create genesis files

  // init geth

  // copy keystore file

  // delete temp geth

};

performer();
