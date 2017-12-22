'use strict';

const rootPrefix = "../.."
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , memcacheCache = require('memcached')
  , Base = require(rootPrefix + '/lib/cache_helper/base');

const Memcache = module.exports = async function() {
  this.connection = null;
  await connect();
  Base.call(this.connection);
};

Memcache.prototype = Object.create(Base.prototype);

Memcache.prototype.constructor = Memcache;

Memcache.prototype.connect = async function(){
  this.connection = await new memcacheCache(coreConstants.MEMCACHE_SERVERS);
  logger.info("connection");
  logger.info(this.connection);
}
