// Load external packages
const chai = require('chai')
  , assert = chai.assert;

// Load cache service
const rootPrefix = "../.."
  , OpenstPlatform = require(rootPrefix + '/index')
  , setupHelper = require(rootPrefix + '/tools/setup/helper')
  , configStrategy = require( setupHelper.configStrategyFilePath() )
  , openstPlatform = new OpenstPlatform( configStrategy )
  , platformServices = openstPlatform.services.utils
;

describe('services/utils/platform_status', function () {

  it('should return promise', async function () {
    var platformStatusObj = new platformServices.platformStatus()
      , response = platformStatusObj.perform()
    ;
    assert.typeOf(response, 'Promise');
  });

});