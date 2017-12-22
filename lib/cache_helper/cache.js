'use strict';

const rootPrefix = "../.."
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , Memcache = require(rootPrefix + '/lib/cache_helper/memcache')
  , Redis = require(rootPrefix + '/lib/cache_helper/redis')
  , InMemory = require(rootPrefix + '/lib/cache_helper/in_memory')

const Cache = module.exports = function () {
  logger.info("start");
  this.cache_object = null;
  if (this._is_memcached()) {
    logger.info("in memcache");
    this.cache_object = new Memcache();
  } else if (this._is_redis()){
    logger.info("in redis");
    this.cache_object = new Redis();
  } else {
    logger.info("in memory");
    this.cache_object = new InMemory();
  }
};

Cache.prototype = {

  get: async function (key) {
    await this.cache_object.get(key);
  },

  set: async function (key, val, expiry) {
   await this.cache_object.set(key, val, expiry);
  },

  del: function ( key ) {

  },

  getMulti: function(keys){

  },

  increment: function(key, value, expires_in, initial) {

  },

  decrement: function(key, value, expires_in, initial) {

  },

  _is_memcached: function(){
    return (coreConstants.CACHING_ENGINE == 'memcache')
  },

  _is_redis: function(){
    return (coreConstants.CACHING_ENGINE == 'redis')
  }

}

const cache = module.exports = new Cache();