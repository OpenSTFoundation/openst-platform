// Load external packages
const chai = require('chai')
  , assert = chai.assert;

// Load cache service
const rootPrefix = "../.."
  , openstPlatform = require(rootPrefix + '/index')
  , platformServices = openstPlatform.services.utils
;

describe('services/utils/platform_status', function() {

  it('should return promise', async function() {
    var platformStatusObj = new platformServices.platformStatus()
      , response = platformStatusObj.perform()
    ;
    assert.typeOf(response, 'Promise');
  });

});