'use strict';

const rootPrefix = "../.."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')

const Base = module.exports = function () {
  logger.info("base connection object");
  logger.info(connection);
  this.connection = connection;
};

Base.prototype = {

  connect: function(){
    Promise.reject("Function Not Implemented");
  },

  get: function (key) {
    return new Promise(function(onResolve, onReject) {
      connection.get(key, function (err, data) {
        if (err){
          logger.error("error while getting cache key");
          logger.error(err);
        }else {
          onResolve(data);
        }
      });
    });
  },

  set: function (key, val, expiry) {
    return new Promise(function(onResolve, onReject) {
      this.connection.set(key, val, expiry, function (err) {
        if (err) {
          logger.error("error while setting cache key");
          logger.error(err);
        } else {
          onResolve(true);
        }
      });
    });
  },

  del: function ( key ) {

  },

  getMulti: function(keys){

  },

  increment: function(key, value, expires_in, initial) {

  },

  decrement: function(key, value, expires_in, initial) {

  }

}