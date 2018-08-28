/**
 *
 * Test for Eth balance Service
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
  platformServices = openstPlatform.services.balance,
  brandedTokenConfigPath = os.homedir() + '/openst-setup/branded_tokens.json',
  brandedTokenConfig = require(brandedTokenConfigPath);

var brandedTokenDetails = brandedTokenConfig[Object.keys(brandedTokenConfig)[0]];
var testValidData = {
  address: brandedTokenDetails['Reserve']
};

describe('services/balance/eth', function() {
  it('should return promise', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));

    var ethObj = new platformServices.eth(dupData),
      response = ethObj.perform();
    assert.typeOf(response, 'Promise');
  });

  it('should fail when params is undefined', async function() {
    var dupData = undefined;

    var ethObj = new platformServices.eth(dupData),
      response = await ethObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is a string', async function() {
    var dupData = 'abc';

    var ethObj = new platformServices.eth(dupData),
      response = await ethObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is empty object', async function() {
    var dupData = {};

    var ethObj = new platformServices.eth(dupData),
      response = await ethObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is empty array', async function() {
    var dupData = [];

    var ethObj = new platformServices.eth(dupData),
      response = await ethObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  // Address Variations
  it('should fail when address is blank', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.address = '';

    var ethObj = new platformServices.eth(dupData),
      response = await ethObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when address is invalid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.address = '0xh32323';

    var ethObj = new platformServices.eth(dupData),
      response = await ethObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  //Success variations
  it('should pass when everything is valid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));

    var ethObj = new platformServices.eth(dupData),
      response = await ethObj.perform();
    assert.equal(response.isSuccess(), true);
    assert.isNotNull(response.data.balance);
  });
});
