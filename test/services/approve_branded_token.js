/**
 *
 * Test for Approve Branded Token balance Service
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
  platformServices = openstPlatform.services.approve,
  brandedTokenConfigPath = os.homedir() + '/openst-setup/branded_tokens.json',
  brandedTokenConfig = require(brandedTokenConfigPath),
  logger = require(rootPrefix + '/helpers/custom_console_logger');

var brandedTokenDetails = brandedTokenConfig[Object.keys(brandedTokenConfig)[0]];
var testValidData = {
  erc20_address: brandedTokenDetails['ERC20'],
  approver_address: configStrategy.OST_UTILITY_CHAIN_OWNER_ADDR,
  approver_passphrase: configStrategy.OST_UTILITY_CHAIN_OWNER_PASSPHRASE,
  approvee_address: configStrategy.OST_STAKER_ADDR,
  to_approve_amount: '2',
  options: {
    returnType: 'txHash',
    tag: 'ILoveOST'
  }
};

describe('services/approve/branded_token', function() {
  it('should return promise', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));

    var brandedTokenObj = new platformServices.brandedToken(dupData),
      response = brandedTokenObj.perform();
    assert.typeOf(response, 'Promise');
  });

  it('should fail when params is undefined', async function() {
    var dupData = undefined;
    response = false;
    try {
      var brandedTokenObj = new platformServices.brandedToken(dupData),
        response = await brandedTokenObj.perform();
      assert.equal(response.isSuccess(), false);
    } catch (e) {
      assert.equal(response, false);
    }
  });

  it('should fail when params is a string', async function() {
    var dupData = 'abc';
    response = false;
    try {
      var brandedTokenObj = new platformServices.brandedToken(dupData),
        response = await brandedTokenObj.perform();
      assert.equal(response.isSuccess(), false);
    } catch (e) {
      assert.equal(response, false);
    }
  });

  it('should fail when params is empty object', async function() {
    var dupData = {};
    response = false;
    try {
      var brandedTokenObj = new platformServices.brandedToken(dupData),
        response = await brandedTokenObj.perform();
      assert.equal(response.isSuccess(), false);
    } catch (e) {
      assert.equal(response, false);
    }
  });

  it('should fail when params is empty array', async function() {
    var dupData = [];
    response = false;
    try {
      var brandedTokenObj = new platformServices.brandedToken(dupData),
        response = await brandedTokenObj.perform();
      assert.equal(response.isSuccess(), false);
    } catch (e) {
      assert.equal(response, false);
    }
  });

  // ERC20 Variations
  it('should fail when erc20 address is blank', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.erc20_address = '';

    var brandedTokenObj = new platformServices.brandedToken(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when erc20 address is invalid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.erc20_address = '0x2323';

    var brandedTokenObj = new platformServices.brandedToken(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  // Approver Address Variations
  it('should fail when approver address is blank', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.approver_address = '';

    var brandedTokenObj = new platformServices.brandedToken(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when approver address is invalid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.approver_address = '0x2323';

    var brandedTokenObj = new platformServices.brandedToken(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  // Approver passphrase Variations
  it('should fail when approver passphrase is blank', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.approver_passphrase = '';

    var brandedTokenObj = new platformServices.brandedToken(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  // Approvee Address Variations
  it('should fail when approvee address is blank', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.approvee_address = '';

    var brandedTokenObj = new platformServices.brandedToken(dupData),
      response = await brandedTokenObj.perform();
    logger.log(response);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when approvee address is invalid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.approvee_address = '0x2323';

    var brandedTokenObj = new platformServices.brandedToken(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  // Approve amount Variations
  it('should fail when approve amount is blank', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.to_approve_amount = '';

    response = false;
    try {
      var brandedTokenObj = new platformServices.brandedToken(dupData),
        response = await brandedTokenObj.perform();
      assert.equal(response.isSuccess(), false);
    } catch (e) {
      assert.equal(response, false);
    }
  });

  it('should fail when approve amount is less than 0', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.to_approve_amount = '-1';

    var brandedTokenObj = new platformServices.brandedToken(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when approve amount is equal to 0', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.to_approve_amount = '0';

    var brandedTokenObj = new platformServices.brandedToken(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), true);
  });

  it('should pass when approve amount is greater than 0', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.to_approve_amount = '100000';

    var brandedTokenObj = new platformServices.brandedToken(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), true);
  });

  // Success Variations
  it('should pass when everything is valid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));

    var brandedTokenObj = new platformServices.brandedToken(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), true);
    assert.isNotNull(response.data.balance);
  });
});
