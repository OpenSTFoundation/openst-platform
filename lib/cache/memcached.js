'use strict';

const rootPrefix = "../.."
  , cacheConfig = require(rootPrefix + '/config/cache')
  , memcached = require("memcached")
  , client = new memcached(cacheConfig.MEMCACHE_SERVERS)
  , defaultLifetime = Number(cacheConfig.DEFAULT_TTL)
  , helper = require(rootPrefix + '/lib/cache/helper');

const memcachedCache = function () {
};

memcachedCache.prototype = {
  get: function (key) {     
    return helper.promisifyMethod(client, 'get', [key]);    
  },

  set: function(key, value) {  
    return helper.promisifyMethod(client, 'set', [key, value, defaultLifetime]);        
  },

  del: function(key) {
    return helper.promisifyMethod(client, 'del', [key]);      
  },

  getObject: function (key) {
    return this.get(key);
  },
 
  setObject: function (key, object) {
    return this.set(key,object);
  },

  multiGet: function(keys) {
    return helper.promisifyMethod(client, 'getMulti', [keys]);      
  },
  
  increment: function(key, value, expires_in, initial) {    
    return helper.promisifyMethod(client, 'incr', [key, value]);
  },
  
  decrement: function(key, value, expires_in, initial) {
    return helper.promisifyMethod(client, 'decr', [key, value]);    
  },

  touch: function (key, lifetime) {
    return helper.promisifyMethod(client, 'touch', [key, lifetime]);      
  }

};

module.exports = new memcachedCache();
