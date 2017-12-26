'use strict';

const rootPrefix = "../.."
  , coreConstants = require(rootPrefix + '/config/core_constants');

var implementer = null;

if (coreConstants.CACHING_ENGINE == 'redis') {
  implementer = require(rootPrefix + '/lib/cache/redis');
} else {
  throw('invalid CACHING_ENGINE');
}


module.exports = implementer;