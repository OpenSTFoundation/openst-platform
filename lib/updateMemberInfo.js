"use strict";

const relativePath = ".."
  ,fs = require('fs')
  ,config = require(relativePath+"/config.json")
  ,logger = require(relativePath+"/helpers/CustomConsoleLogger")
  ,path = require('path');

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
      , error = function(reason) {
        logger.error("Failed to update Config file! == "+reason)
        return Promise.resolve(reason);
      };

    return new Promise( (resolve,reject) => {
      fs.writeFile(path.join(__dirname, '/../config.json'), json, err => err ? reject(err) : resolve() );
    })
    .then(success)
    .catch(error);
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

