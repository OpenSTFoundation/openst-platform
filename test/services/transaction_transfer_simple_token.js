// Load external packages
const chai = require('chai')
  , assert = chai.assert
  , Path = require('path')
  , os = require('os')
;

// Load cache service
const rootPrefix = "../.."
  , openstPlatform = require(rootPrefix + '/index')
  , platformServices = openstPlatform.services.transaction.transfer
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , brandedTokenConfigPath = os.homedir() + "/openst-setup/branded_tokens.json"
  , brandedTokenConfig = require(brandedTokenConfigPath)
;

var testValidData = {
  sender_address: process.env.OST_FOUNDATION_ADDR,
  sender_passphrase: process.env.OST_FOUNDATION_PASSPHRASE,
  sender_name: 'foundation',
  recipient_address: process.env.OST_UTILITY_CHAIN_OWNER_ADDR,
  recipient_name: 'utilityChainOwner',
  amount_in_wei: 20,
  options: {
    returnType: 'txHash',
    tag: 'Grant'
  }
};

describe('services/transaction/transfer/simple_token', function() {

  it('should return promise', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = simpleTokenObj.perform()
    ;
    assert.typeOf(response, 'Promise');
  });

  it('should fail when params is undefined', async function() {
    var dupData = undefined;

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is a string', async function() {
    var dupData = 'abc';

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is empty object', async function() {
    var dupData = {};

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is empty array', async function() {
    var dupData = [];

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  // Options Variations
  it('should fail when tag is blank', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.options.tag = '';

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when tag is invalid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.options.tag = 'a@b';

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  // Sender Variations

  it('should fail when sender name is invalid, as named keys have higher priority', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.sender_name = 'Google';

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when sender address is invalid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.sender_name = ''; // has higher priority
    dupData.sender_address = 'abc';

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when sender address is valid, but has no balance', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.sender_name = ''; // has higher priority
    dupData.sender_address = '0xb4d7bedf714e6c7cd1a641f705870fa19144a021';

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should pass when sender passphrase is invalid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.sender_name = ''; // has higher priority
    dupData.sender_passphrase = 'abc';

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  // Recipient Variations

  it('should fail when recipient address is invalid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.recipient_name = ''; // has higher priority
    dupData.recipient_address = 'abc';

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when recipient name is invalid, as named keys have higher priority', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.recipient_name = 'abc';

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  // Amount Variations

  it('should fail when amount is undefined', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.amount_in_wei = undefined;

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when amount is string', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.amount_in_wei = 'abc';

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when amount is float', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.amount_in_wei = 100.2;

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when amount is less than 1 and greater than 0', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.amount_in_wei = 0.2;

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when amount is 0', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.amount_in_wei = 0;

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when amount is negative number', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.amount_in_wei = -100;

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  // Success Variations

  it('should pass when everything is valid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;
    assert.equal(response.isSuccess(), true);
    assert.isNotNull(response.data.txUuid);
    assert.isNotNull(response.data.txHash);
  });

  it('should pass when returnType is invalid, with default returnType txHash', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.options.returnType = 'myReturnType';

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;

    assert.equal(response.isSuccess(), true);
    assert.isNotNull(response.data.txUuid);
    assert.isNotNull(response.data.txHash);
    assert.deepEqual(response.data.txReceipt, {});
  });

  it('should pass when returnType is uuid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.options.returnType = 'uuid';

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;

    assert.equal(response.isSuccess(), true);
    assert.isNotNull(response.data.txUuid);
    assert.equal(response.data.txHash, '');
    assert.deepEqual(response.data.txReceipt, {});
  });

  it('should pass when returnType is txReceipt', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.options.returnType = 'txReceipt';

    var simpleTokenObj = new platformServices.simpleToken(dupData)
      , response = await simpleTokenObj.perform()
    ;

    assert.equal(response.isSuccess(), true);
    assert.isNotNull(response.data.txUuid);
    assert.isNotNull(response.data.txHash);
    assert.isNumber(response.data.txReceipt.blockNumber);
  });

});