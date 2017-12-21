'use strict';

const rootPrefix = "../.."
  , redisCache = require('redis')
  , memcacheCache = require('memcached')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')

const Cache = module.exports = function () {

};

Cache.prototype = {

  connect: function(){

  },

  get: function (key) {

  },

  set: function (key, val, expiry) {

  },

  del: function ( key ) {

  },

  getMulti: function(keys){

  },

  increment: function(key, value = 1, expires_in = nil, initial = nil) {

  },

  decrement: function(key, value = 1, expires_in = nil, initial = nil) {

  },

}