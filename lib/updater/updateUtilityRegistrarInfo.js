"use strict";

const relativePath = "../.."
  , fs = require('fs')
  , utilityRegistrarConfig = require(relativePath + "/utility_registar_config.json")
  , logger = require(relativePath + "/helpers/CustomConsoleLogger")
  , path = require('path');

const UpdateUtilityRegistrarInfo = module.exports = function (utilityChainId) {
  this.utilityChainId = utilityChainId;
}

UpdateUtilityRegistrarInfo.prototype = {

  utilityChainId: null,

  writeInConfig: function () {

    const json = JSON.stringify(utilityRegistrarConfig, null, 4)
      , success = function () {
        logger.win("Config updated.")
        return Promise.resolve();
      }
      , catchAndExit = function (reason) {
        reason && logger.error("Failed to update Config file! == " + reason)
        process.exit(1);
      };

    return new Promise((resolve, reject) = > {
      fs.writeFile(path.join(__dirname, '/../utility_registar_config.json'), json, err = > err ? reject(err) : resolve());
    })
    .then(success)
    .catch(catchAndExit);
  },

  setRegistrarAddress: function (address) {

    var utilityRegistarConfig = utilityRegistrarConfig[utilityChainId];

    if (!utilityRegistarConfig) {
      utilityRegistarConfig = {}
    }

    utilityRegistarConfig["registrarAddr"] = address;

    this.writeInConfig();

  },

  setRegistrarPassphrase: function (passphrase) {

    var utilityRegistarConfig = utilityRegistrarConfig[utilityChainId];

    if (!utilityRegistarConfig) {
      utilityRegistarConfig = {}
    }

    utilityRegistarConfig["registrarPassphrase"] = passphrase;

    this.writeInConfig();

  }
};

