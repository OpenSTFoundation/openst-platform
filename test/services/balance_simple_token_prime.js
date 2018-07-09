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
;

var testValidData = {
  address: process.env.OST_UTILITY_CHAIN_OWNER_ADDR
};

describe('services/balance/simple_token_prime', function () {

  it('should return promise', async function () {
    var dupData = JSON.parse(JSON.stringify(testValidData));

    var simpleTokenPrimeObj = new platformServices.simpleTokenPrime(dupData)
      , response = simpleTokenPrimeObj.perform()
    ;
    assert.typeOf(response, 'Promise');
  });

  it('should fail when params is undefined', async function () {
    var dupData = undefined;

    var simpleTokenPrimeObj = new platformServices.simpleTokenPrime(dupData)
      , response = await simpleTokenPrimeObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is a string', async function () {
    var dupData = 'abc';

    var simpleTokenPrimeObj = new platformServices.simpleTokenPrime(dupData)
      , response = await simpleTokenPrimeObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is empty object', async function () {
    var dupData = {};

    var simpleTokenPrimeObj = new platformServices.simpleTokenPrime(dupData)
      , response = await simpleTokenPrimeObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is empty array', async function () {
    var dupData = [];

    var simpleTokenPrimeObj = new platformServices.simpleTokenPrime(dupData)
      , response = await simpleTokenPrimeObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  // Address Variations
  it('should fail when address is blank', async function () {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.address = '';

    var simpleTokenPrimeObj = new platformServices.simpleTokenPrime(dupData)
      , response = await simpleTokenPrimeObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when address is invalid', async function () {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.address = '0xh32323';

    var simpleTokenPrimeObj = new platformServices.simpleTokenPrime(dupData)
      , response = await simpleTokenPrimeObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  // Success Variations

  it('should pass when everything is valid', async function () {
    var dupData = JSON.parse(JSON.stringify(testValidData));

    var simpleTokenPrimeObj = new platformServices.simpleTokenPrime(dupData)
      , response = await simpleTokenPrimeObj.perform()
    ;
    assert.equal(response.isSuccess(), true);
    assert.isNotNull(response.data.balance);
  });


});