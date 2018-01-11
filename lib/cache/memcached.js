'use strict';

/**
 * Implementation of the caching layer using Memcached.<br><br>
 *
 * {@link module:lib/cache/implementer} acts as a wrapper for this module.
 *
 * @module lib/cache/memcached
 */

const rootPrefix = "../.."
  , cacheConfig = require(rootPrefix + '/config/cache')
  , memcached = require("memcached")
  , client = new memcached(cacheConfig.MEMCACHE_SERVERS)
  , defaultLifetime = Number(cacheConfig.DEFAULT_TTL)
  , helper = require(rootPrefix + '/lib/cache/helper');

const memcachedCache = function () {
};

memcachedCache.prototype = {

  /**
   * Get the value for the given key.
   * @param {string} key The key
   * @return {Promise<mixed>} A promise to return value of the key.
   */
  get: function (key) {     
    return helper.promisifyMethod(client, 'get', [key]);    
  },

  /**
   * Stores a new value
   * @param {string} key The key
   * @param {mixed} val JSON/number/string that you want to store.   
   * @return {Promise<boolean>} A promise to set the key.  On resolve, the boolean flag indicates if cache was set successfully or not.
   */
  set: function(key, value) {  
    return helper.promisifyMethod(client, 'set', [key, value, defaultLifetime]);        
  },

  /**
   * Remove the key from cache.
   * @param {string} key The key.
   * @return {Promise<boolean>} A promise to delete. On resolve, the boolean flag indicates if key was valid before deleting.
   */
  del: function(key) {
    return helper.promisifyMethod(client, 'del', [key]);      
  },

  /**
   * Get the object for the given key.
   * @param {string} key The key
   */
  getObject: function (key) {
    return this.get(key);
  },
 
  /**
   * Stores a new Object
   * @param {string} key The key
   * @param {mixed} val JSON/number/string that you want to store.      
   */
  setObject: function (key, object) {
    return this.set(key,object);
  },

  /**
   * Get the object for the given keys eg: {key1:value1,key2:value2}.
   * @param {array} keys The array of keys
   */
  multiGet: function(keys) {
    return helper.promisifyMethod(client, 'getMulti', [keys]);      
  },

  /**
   * Increment the value of key
   * @param {string} key The key
   * @param {number} increment by value
   * @return {Promise<boolean>} A promise to increment the value of key.
   */  
  increment: function(key, byValue) { 
    const value = byValue ? byValue : 1;   
    return helper.promisifyMethod(client, 'incr', [key, value]);
  },
  
  /**
   * Decrement the value of key
   * @param {string} key The key
   * @param {number} decrement by value   
   * @return {Promise<boolean>} A promise to decrement the value of key.
   */  
  decrement: function(key, byValue) {    
    const value = byValue ? byValue : 1;   
    return helper.promisifyMethod(client, 'decr', [key, value]);    
  },

  /**
   * Touches the given key.
   * @param {string} key The key
   * @param {number} lifetime After how long should the key expire measured in seconds.
   * @return {Promise} A promise to touch
   */
  touch: function (key, lifetime) {
    return helper.promisifyMethod(client, 'touch', [key, lifetime]);      
  }

};

module.exports = new memcachedCache();
