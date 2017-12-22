'use strict';

const rootPrefix = "../.."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , memcacheCache = require('memcached')
  , Base = require(rootPrefix + '/cache_helper/base');

const Memcache = module.exports = function () {
 connect();
};

Memcache.prototype = Object.create(Base.prototype);

Memcache.prototype = {

  connect: function(){

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