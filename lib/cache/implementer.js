'use strict';

const rootPrefix = "../.."
  , coreConstants = require(rootPrefix + '/config/core_constants');

var implementer = null;

if (coreConstants.CACHING_ENGINE == 'redis') {
  implementer = require(rootPrefix + '/lib/cache/redis');
} else if(coreConstants.CACHING_ENGINE == 'memcache'){
	implementer = require(rootPrefix + '/lib/cache/memcached');
}	else if (coreConstants.CACHING_ENGINE == 'none') {
  implementer = require(rootPrefix + '/lib/cache/in_memory');
} else {
  throw('invalid CACHING_ENGINE');
}


module.exports = implementer;