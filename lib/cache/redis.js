'use strict';

/**
 * Implementation of the caching layer using Redis.
 * A persistent Redis connection per Node js worker is maintained and this connection is singleton.<br><br>
 *
 * {@link module:lib/cache/implementer} acts as a wrapper for this module.
 *
 * @module lib/cache/redis
 */

const redis = require("redis");

const rootPrefix = "../.."
  , cacheConfig = require(rootPrefix + '/config/cache')
  , helper = require(rootPrefix + '/lib/cache/helper');

const const clientOptions = {host: cacheConfig.REDIS_HOST, port: cacheConfig.REDIS_PORT, password: cacheConfig.REDIS_PASS, tls: cacheConfig.REDIS_HOST}
  , client = redis.createClient(clientOptions)
  , defaultLifetime = Number(cacheConfig.DEFAULT_TTL);

const redisCache = function () {
};

redisCache.prototype = {

  /**
   * Get the value for the given key.
   * @param {string} key The key
   * @return {Promise<mixed>} A promise to return value of the key.
   */
  get: function (key) {
    return helper.promisifyMethod(client, 'get', [key]);
  },

  getObject: function (key) {
    return helper.promisifyMethod(client, 'hgetall', [key]);
  },

  set: function (key, value) {
    return helper.promisifyMethod(client, 'set', [key, value, 'EX', defaultLifetime]);
  },

  setObject: function (key, object) {
    var arrayRepresentation = [];
    for (var i in object) {
      arrayRepresentation.push(i);
      arrayRepresentation.push(object[i]);
    }

    return helper.promisifyMethod(client, 'hmset', [key, arrayRepresentation]);
  },

  del: function (key) {
    return helper.promisifyMethod(client, 'del', [key]);
  },

  multiGet: function (keys) {
    const mapDataValsToKeys = function (data) {
      var retVal = {};

      for (var i = 0; i < data.length; i++) {
        retVal[keys[i]] = data[i];
      }
      return retVal;
    };

    return helper.promisifyMethod(client, 'mget', [keys]).then(mapDataValsToKeys);
  },

  increment: function (key, byValue) {
    if(byValue){
      return helper.promisifyMethod(client, 'incrby', [key, byValue]);
    } else {
      // if the byValue is not passed, we will increment by 1
      return helper.promisifyMethod(client, 'incr', [key]);
    }
  },

  decrement: function (key, byValue) {
    if(byValue){
      return helper.promisifyMethod(client, 'decrby', [key, byValue]);
    } else {
      // if the byValue is not passed, we will decrement by 1
      return helper.promisifyMethod(client, 'decr', [key]);
    }
  },

  touch: function (key, lifetime) {
    return helper.promisifyMethod(client, 'expire', [key, lifetime]);
  }
};

module.exports = new redisCache();