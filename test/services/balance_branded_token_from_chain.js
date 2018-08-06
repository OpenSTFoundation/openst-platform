/**
 *
 * Test for Branded Token from chain balance Service
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
  erc20_address: brandedTokenDetails['ERC20'],
  address: brandedTokenDetails['Reserve']
};

describe('services/balance/branded_token', function() {
  it('should return promise', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));

    var brandedTokenFromChainObj = new platformServices.brandedTokenFromChain(dupData),
      response = brandedTokenFromChainObj.perform();
    assert.typeOf(response, 'Promise');
  });

  it('should fail when params is undefined', async function() {
    var dupData = undefined;

    var brandedTokenFromChainObj = new platformServices.brandedTokenFromChain(dupData),
      response = await brandedTokenFromChainObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is a string', async function() {
    var dupData = 'abc';

    var brandedTokenFromChainObj = new platformServices.brandedTokenFromChain(dupData),
      response = await brandedTokenFromChainObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is empty object', async function() {
    var dupData = {};

    var brandedTokenFromChainObj = new platformServices.brandedTokenFromChain(dupData),
      response = await brandedTokenFromChainObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is empty array', async function() {
    var dupData = [];

    var brandedTokenFromChainObj = new platformServices.brandedTokenFromChain(dupData),
      response = await brandedTokenFromChainObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  // Address Variations
  it('should fail when address is blank', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.address = '';

    var brandedTokenFromChainObj = new platformServices.brandedTokenFromChain(dupData),
      response = await brandedTokenFromChainObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when address is invalid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.address = '0xh32323';

    var brandedTokenFromChainObj = new platformServices.brandedTokenFromChain(dupData),
      response = await brandedTokenFromChainObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  // ERC20 Variations
  it('should fail when erc20 address is blank', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.erc20_address = '';

    var brandedTokenFromChainObj = new platformServices.brandedTokenFromChain(dupData),
      response = await brandedTokenFromChainObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when erc20 address is invalid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.erc20_address = '0x2323';

    var brandedTokenFromChainObj = new platformServices.brandedTokenFromChain(dupData),
      response = await brandedTokenFromChainObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  // Success Variations

  it('should pass when everything is valid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));

    var brandedTokenFromChainObj = new platformServices.brandedTokenFromChain(dupData),
      response = await brandedTokenFromChainObj.perform();
    assert.equal(response.isSuccess(), true);
    assert.isNotNull(response.data.balance);
  });
});
