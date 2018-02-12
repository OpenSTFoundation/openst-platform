// Load external packages
const chai = require('chai')
  , assert = chai.assert
  , Path = require('path')
  , os = require('os')
;

// Load cache service
const rootPrefix = "../.."
  , openstPlatform = require(rootPrefix + '/index')
  , platformServices = openstPlatform.services.balance
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , brandedTokenConfigPath = os.homedir() + "/openst-setup/branded_tokens.json"
  , brandedTokenConfig = require(brandedTokenConfigPath)
;
var brandedTokenDetails = brandedTokenConfig[Object.keys(brandedTokenConfig)[0]]
var testValidData = {
  address: brandedTokenDetails['Reserve'],
  erc20_address: brandedTokenDetails['ERC20']
};

describe('services/balance/branded_token', function() {

  it('should return promise', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));

    var brandedTokenObj = new platformServices.brandedToken(dupData)
      , response = brandedTokenObj.perform()
    ;
    assert.typeOf(response, 'Promise');
  });

  it('should fail when params is undefined', async function() {
    var dupData = undefined;

    var brandedTokenObj = new platformServices.brandedToken(dupData)
      , response = await brandedTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is a string', async function() {
    var dupData = 'abc';

    var brandedTokenObj = new platformServices.brandedToken(dupData)
      , response = await brandedTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is empty object', async function() {
    var dupData = {};

    var brandedTokenObj = new platformServices.brandedToken(dupData)
      , response = await brandedTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is empty array', async function() {
    var dupData = [];

    var brandedTokenObj = new platformServices.brandedToken(dupData)
      , response = await brandedTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  // Address Variations
  it('should fail when address is blank', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.address = '';

    var brandedTokenObj = new platformServices.brandedToken(dupData)
      , response = await brandedTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when address is invalid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.address = '0xh32323';

    var brandedTokenObj = new platformServices.brandedToken(dupData)
      , response = await brandedTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  // ERC20 Variations
  it('should fail when erc20 address is blank', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.erc20_address = '';

    var brandedTokenObj = new platformServices.brandedToken(dupData)
      , response = await brandedTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when erc20 address is invalid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.erc20_address = '0x2323';

    var brandedTokenObj = new platformServices.brandedToken(dupData)
      , response = await brandedTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  // Success Variations

  it('should pass when erc20 address is valid, but does not exit', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.erc20_address = '0xb4d7bedf714e6c7cd1a641f705870fa19144a062';

    var brandedTokenObj = new platformServices.brandedToken(dupData)
      , response = await brandedTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), true);
    assert.equal(response.data.balance, 0);
  });

  it('should pass when everything is valid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));

    var brandedTokenObj = new platformServices.brandedToken(dupData)
      , response = await brandedTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), true);
    assert.isNotNull(response.data.balance);
  });


});