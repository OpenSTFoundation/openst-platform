'use strict';

const rootPrefix = "../.."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , memcacheCache = require('memcached')
  , Base = require(rootPrefix + '/cache_helper/base');

const Memcache = module.exports = function () {
  var connection = nil;
  connect();
  Base.call(this.connection);
};

Memcache.prototype = Object.create(Base.prototype);

Memcache.prototype = {

  connect: function(){
    this.connection = new memcacheCache(['127.0.0.1:11211']);
  },

  getMulti: function(keys){

  },

  increment: function(key, value, expires_in, initial) {

  },

  decrement: function(key, value, expires_in, initial) {

  }

}