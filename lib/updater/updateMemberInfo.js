"use strict";

const rootPrefix = "../.."
  , fs = require('fs')
  , config = require(rootPrefix+"/config.json")
  , logger = require(rootPrefix+"/helpers/custom_console_logger")
  , path = require('path')
  ;

const UpdateMemberInfo = module.exports = function ( memberObject ) {
  this.memberObject = memberObject;
}

UpdateMemberInfo.prototype = {

  memberObject: null,

  writeInConfig: function() {

    const json = JSON.stringify(config, null, 4)
      , success = function() {
        logger.win("Config updated.")
        return Promise.resolve();
      }
      , catchAndExit = function(reason) {
        reason && logger.error("Failed to update Config file! == "+reason)
        process.exit(1);
      };

    return new Promise( (resolve,reject) => {
      fs.writeFile(path.join(__dirname, '/../config.json'), json, err => err ? reject(err) : resolve() );
    })
    .then(success)
    .catch(catchAndExit);
  },

  setMemberReserveAddress: function(address) {

    this.memberObject.Reserve = address;

    this.writeInConfig();

  },

  setMemberContractAddress: function(address) {

    this.memberObject.ERC20 = address;

    this.writeInConfig();
  },

  setMemberUUID: function(uuid) {

    this.memberObject.UUID = uuid;

    this.writeInConfig();
  }

};

