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
      client.get(key, function (err, data) {
        if (err) {
          onReject(err);
        } else {
          onResolve(data)
        }
      })
    })
  },

  getObject: function (key) {
    return new Promise(function (onResolve, onReject) {
      client.hgetall(key, function (err, data) {
        if (err) {
          onReject(err);
        } else {
          onResolve(data)
        }
      })
    })
  },

  set: function (key, value) {

    return new Promise(function (onResolve, onReject) {
      client.set(key, value, function (err, data) {
        if (err) {
          onReject(err);
        } else {
          onResolve(data)
        }
      })
    })
  },

  setObject: function (key, object) {
    var arrayRepresentation = [];
    for (var i in object) {
      arrayRepresentation.push(i);
      arrayRepresentation.push(object[i]);
    }

    return new Promise(function (onResolve, onReject) {
      client.hmset(key, arrayRepresentation, function (err, data) {
        if (err) {
          onReject(err);
        } else {
          onResolve(data)
        }
      })
    })
  },

  del: function (key) {
  },

  multiGet: function (keys) {

  },

  increment: function (key, value, expires_in, initial) {

  },

  decrement: function (key, value, expires_in, initial) {

  },

  touch: function (key, lifetime) {

  }
};

module.exports = new redisCache();