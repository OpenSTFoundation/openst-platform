'use strict';

const rootPrefix = "../.."
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , Memcache = require(rootPrefix + '/cache_helper/memcache')
  , Redis = require(rootPrefix + '/cache_helper/redis')
  , InMemory = require(rootPrefix + '/cache_helper/in_memory')

const Cache = module.exports = function () {
  var cache_object = '';
  if (_is_memcached) {
    cache_object = new Memcache();
  } else if (_is_redis){
    cache_object = new Redis();
  } else {
    cache_object = new InMemory();
  }
};

Cache.prototype = {

  get: function (key) {
    cache_object.get(key);
  },

  set: function (key, val, expiry) {
    cache_object.set(key, val, expiry);
  },

  del: function ( key ) {

  },

  getMulti: function(keys){

  },

  increment: function(key, value = 1, expires_in = nil, initial = nil) {

  },

  decrement: function(key, value = 1, expires_in = nil, initial = nil) {

  },

  _is_memcached: function(){
    coreConstants.CACHING_ENGINE == 'memcached'
  },

  _is_redis: function(){
    coreConstants.CACHING_ENGINE == 'redis'
  }

}

const cache = module.exports = new Cache();