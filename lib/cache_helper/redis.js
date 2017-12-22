'use strict';

const rootPrefix = "../.."
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , redisCache = require('redis')
  , Base = require(rootPrefix + '/lib/cache_helper/base');

const connection = redisCache.createClient(coreConstants.REDIS_PORT, coreConstants.REDIS_SERVER);

connection.on('connect', function() {
  console.info('redis connected');
  Base.call();
});

const Redis = module.exports = function() {
  console.log("**** %s", connection);
};
Redis.prototype = Object.create(Base.prototype);
Redis.prototype.constructor = Redis;

//var redisConnection = null;
//
//var establishConnection = function(){
//  redisConnection = redisConnection || redisCache.createClient(coreConstants.REDIS_PORT, coreConstants.REDIS_SERVER);
//  redisConnection.on('connect', function() {
//    console.info('redis connected');
//    console.info(redisConnection);
//    //Base.call(redisConnection);
//  });
//};
//
//
//
//const Redis = module.exports = function() {
//  if (!redisConnection) {
//    establishConnection();
//  } else {
//    Base.call(redisConnection);
//  }
//};
//
//Redis.prototype = Object.create(Base.prototype);
//
//Redis.prototype.constructor = Redis;