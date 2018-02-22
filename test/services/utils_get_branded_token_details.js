// Load external packages
const chai = require('chai')
  , assert = chai.assert
  , Path = require('path')
  , os = require('os')
;

// Load cache service
const rootPrefix = "../.."
  , openstPlatform = require(rootPrefix + '/index')
  , platformServices = openstPlatform.services.utils
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , brandedTokenConfigPath = os.homedir() + "/openst-setup/branded_tokens.json"
  , brandedTokenConfig = require(brandedTokenConfigPath)
;

var testValidData = {
  uuid: Object.keys(brandedTokenConfig)[0]
};

var verifyAgainstData = {
  symbol: brandedTokenConfig[testValidData.uuid]['Symbol'],
  name: brandedTokenConfig[testValidData.uuid]['Name'],
  conversion_factor: brandedTokenConfig[testValidData.uuid]['ConversionFactor'],  
};

describe('services/utils/get_branded_token_details', function() {

  it('should return promise', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));

    var getBrandedTokenDetailsObj = new platformServices.getBrandedTokenDetails(dupData)
      , response = getBrandedTokenDetailsObj.perform()
    ;
    assert.typeOf(response, 'Promise');
  });

  it('should fail when params is undefined', async function() {
    var dupData = undefined;

    var getBrandedTokenDetailsObj = new platformServices.getBrandedTokenDetails(dupData)
      , response = await getBrandedTokenDetailsObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is a string', async function() {
    var dupData = 'abc';

    var getBrandedTokenDetailsObj = new platformServices.getBrandedTokenDetails(dupData)
      , response = await getBrandedTokenDetailsObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is empty object', async function() {
    var dupData = {};

    var getBrandedTokenDetailsObj = new platformServices.getBrandedTokenDetails(dupData)
      , response = await getBrandedTokenDetailsObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is empty array', async function() {
    var dupData = [];

    var getBrandedTokenDetailsObj = new platformServices.getBrandedTokenDetails(dupData)
      , response = await getBrandedTokenDetailsObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when invalid uuid is set', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.uuid = 'abc';

    var getBrandedTokenDetailsObj = new platformServices.getBrandedTokenDetails(dupData)
      , response = await getBrandedTokenDetailsObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when uuid is valid but not associated with BT', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.uuid = '0x40a3bf6c2f1c802bcb7b1f10c7d11726b3926a5e4dcf083cd72a9f69d4109c7b';

    var getBrandedTokenDetailsObj = new platformServices.getBrandedTokenDetails(dupData)
      , response = await getBrandedTokenDetailsObj.perform()
    ;
    assert.equal(response.isSuccess(), false);    
  });

  it('should pass when chain is valid and associated with BT', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));

    var getBrandedTokenDetailsObj = new platformServices.getBrandedTokenDetails(dupData)
      , response = await getBrandedTokenDetailsObj.perform()
    ;
    assert.equal(response.isSuccess(), true);

    assert.equal(response.data.symbol, verifyAgainstData.symbol);
    assert.equal(response.data.name, verifyAgainstData.name);
    assert.equal(response.data.conversion_factor, verifyAgainstData.conversion_factor);

    assert.hasAllKeys(response.data, ['symbol', 'name', 'conversion_rate',
       'conversion_rate_decimals', 'conversion_factor', 'decimals',
         'chain_id_utility', 'simple_stake_contract_address', 'staking_account']);
  });

});