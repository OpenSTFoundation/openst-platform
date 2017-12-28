'use strict';

/**
 * Depending on an environment variable, the caching engine is chosen. This module acts as a wrapper / factory for the
 * cache layer. Following are the actual implemtations of the cache layer methods: <br>
 *     <ul>
 *       <li>Memcached implementation - ref: {@link module:lib/cache/memcached}</li>
 *       <li>Redis implementation - ref: {@link module:lib/cache/redis}</li>
 *       <li>In Memory implementation - ref: {@link module:lib/cache/in_memory}</li>
 *     </ul>
 *
 * @module lib/cache/implementer
 */

const rootPrefix = "../.."
  , coreConstants = require(rootPrefix + '/config/core_constants');

var implementer = null;

if (coreConstants.CACHING_ENGINE == 'redis') {
  implementer = require(rootPrefix + '/lib/cache/redis');
} else if(coreConstants.CACHING_ENGINE == 'memcached'){
	implementer = require(rootPrefix + '/lib/cache/memcached');
}	else if (coreConstants.CACHING_ENGINE == 'none') {
  implementer = require(rootPrefix + '/lib/cache/in_memory');
} else {
  throw('invalid CACHING_ENGINE');
}


module.exports = implementer;