/**
 *
 * Test for Generate Raw Keys Utility Service
 *
 */

// Load external packages
const chai = require('chai'),
  assert = chai.assert,
  Path = require('path'),
  os = require('os');

// Load cache service
const rootPrefix = '../..',
  OpenstPlatform = require(rootPrefix + '/index'),
  setupHelper = require(rootPrefix + '/tools/setup/helper'),
  configStrategy = require(setupHelper.configStrategyFilePath()),
  openstPlatform = new OpenstPlatform(configStrategy),
  platformServices = openstPlatform.services.utils;

describe('services/utils/generate_raw_key', function() {
  it('should return promise', async function() {
    var generateRawKeyObj = new platformServices.generateRawKey(),
      response = generateRawKeyObj.perform();
    assert.typeOf(response, 'object');
  });

  it('should pass when private key length is 66', function() {
    var generateRawKeyObj = new platformServices.generateRawKey(),
      response = generateRawKeyObj.perform();
    assert.equal(response.params.success_data.privateKey.length == 66, true);
  });

  it('should pass when address length is 42', function() {
    var generateRawKeyObj = new platformServices.generateRawKey(),
      response = generateRawKeyObj.perform();
    assert.equal(response.params.success_data.address.length == 42, true);
  });
});
