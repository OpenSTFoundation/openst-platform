"use strict";

const path = require('path')
  , rootPrefix = ".."
;

/*
 * Constants file: Load constants from environment variables
 *
 */

function define(name, value) {
  Object.defineProperty(exports, name, {
    value: value,
    enumerable: true
  });
}

define("REDIS_HOST", process.env.REDIS_HOST);
define("REDIS_PORT", process.env.REDIS_PORT);
define("REDIS_PASS", process.env.REDIS_PASS);

define("MEMCACHE_SERVERS", process.env.MEMCACHE_SERVERS);
define("DEFAULT_TTL", process.env.DEFAULT_TTL); // In seconds
