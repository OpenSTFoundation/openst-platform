'use strict';

const rootPrefix = "../.."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , redisCache = require('redis')
  , Base = require(rootPrefix + '/cache_helper/redis');

const Redis = module.exports = function () {
  var connection = nil;
  connect();
  Base.call(this.connection);
};

Redis.prototype = Object.create(Base.prototype);

Redis.prototype = {

  connect: function(){
    this.connection = redisCache.createClient(6379, ['127.0.0.1'])
  },

  getMulti: function(keys){

  },

  increment: function(key, value, expires_in, initial) {

  },

  decrement: function(key, value, expires_in, initial) {

  }

}