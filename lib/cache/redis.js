'use strict';

const rootPrefix = "../.."
  //, coreConstants = require(rootPrefix + '/config/core_constants')
  , cacheConfig = require(rootPrefix + '/config/cache')
  , redis = require("redis")
  , client = redis.createClient(cacheConfig.REDIS_PORT, cacheConfig.REDIS_HOST);

const redisHelper = {
  get: function (key) {
    client.get(key, function(err, reply) {
      // reply is null when the key is missing
      console.log(reply);
    })
  },

  set: function(key, value) {
    client.set(key, value);
  }
};

module.exports = redisHelper;