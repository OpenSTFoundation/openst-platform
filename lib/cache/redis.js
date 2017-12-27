'use strict';

const redis = require("redis");

const rootPrefix = "../.."
  , cacheConfig = require(rootPrefix + '/config/cache')
  , helper = require(rootPrefix + '/lib/cache/helper');

const client = redis.createClient(cacheConfig.REDIS_PORT, cacheConfig.REDIS_HOST)
  , defaultLifetime = Number(cacheConfig.DEFAULT_TTL);

const redisCache = function () {
};

redisCache.prototype = {
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