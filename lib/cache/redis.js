'use strict';

const rootPrefix = "../.."
  , cacheConfig = require(rootPrefix + '/config/cache')
  , redis = require("redis")
  , client = redis.createClient(cacheConfig.REDIS_PORT, cacheConfig.REDIS_HOST);

const redisCache = function () {
};

redisCache.prototype = {
  get: function (key) {
    return new Promise(function (onResolve, onReject) {
      client.get(key, function(err, data) {
        if(err){
          onReject(err);
        } else {
          onResolve(data)
        }
      })
    })
  },

  set: function(key, value) {
    client.set(key, value);
    return Promise.resolve();
  },

  del: function(key) {
  },

  multiGet: function(keys) {

  },

  increment: function(key, value, expires_in, initial) {

  },

  decrement: function(key, value, expires_in, initial) {

  },

  touch: function (key, lifetime) {

  }
};

module.exports = new redisCache();