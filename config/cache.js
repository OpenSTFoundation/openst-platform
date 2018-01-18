"use strict";

/*
 * Cache Related Constants:
 *
 * Load caching layer related constant variables from environment variables
 *
 */

const path = require('path')
  , rootPrefix = ".."
;

function define(name, value) {
  Object.defineProperty(exports, name, {
    value: value,
    enumerable: true
  });
}

// Default cache TTL (in seconds)
define("DEFAULT_TTL", process.env.DEFAULT_TTL);

// Constants for redis caching layer
define("REDIS_HOST", process.env.REDIS_HOST);
define("REDIS_PORT", process.env.REDIS_PORT);
define("REDIS_PASS", process.env.REDIS_PASS);

// Constants for memcached caching layer
define("MEMCACHE_SERVERS", process.env.MEMCACHE_SERVERS);
