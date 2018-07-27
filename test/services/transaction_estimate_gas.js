/**
 *
 * Test for estimate gas service
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
  platformServices = openstPlatform.services.transaction,
  brandedTokenConfigPath = os.homedir() + '/openst-setup/branded_tokens.json',
  brandedTokenConfig = require(brandedTokenConfigPath),
  coreAddressesKlass = require(rootPrefix + '/config/core_addresses');

var brandedTokenDetails = brandedTokenConfig[Object.keys(brandedTokenConfig)[0]];
var coreAddresses = new coreAddressesKlass(configStrategy);

//Following params are estimate of stPrime transfer to branded token reserve address
var testValidData = {
  contract_name: 'brandedToken',
  contract_address: brandedTokenDetails['ERC20'],
  chain: 'utility',
  sender_address: brandedTokenDetails['Reserve'],
  method_name: 'transfer',
  method_arguments: [configStrategy.OST_FOUNDATION_ADDR, '3']
};

describe('services/transaction/estimate_gas', function() {
  it('should return promise', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    var brandedTokenObj = new platformServices.estimateGas(dupData),
      response = brandedTokenObj.perform();
    assert.typeOf(response, 'Promise');
  });

  it('should return number', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    var brandedTokenObj = new platformServices.estimateGas(dupData),
      response = await brandedTokenObj.perform();
    assert.typeOf(response.data.gas_to_use, 'number');
  });

  it('should return error as method name is invalid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.method_name = 'abc';
    var brandedTokenObj = new platformServices.estimateGas(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
    assert.isEmpty(response.data);
  });

  it('should return error as contract name is empty', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.contract_name = '';
    var brandedTokenObj = new platformServices.estimateGas(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
    assert.isEmpty(response.data);
  });

  it('should return error as contract address is empty', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.contract_address = '';
    var brandedTokenObj = new platformServices.estimateGas(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
    assert.isEmpty(response.data);
  });

  it('should return error as chain is empty', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.chain = '';
    var brandedTokenObj = new platformServices.estimateGas(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
    assert.isEmpty(response.data);
  });

  it('should return error as chain name is empty', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.chain = '';
    var brandedTokenObj = new platformServices.estimateGas(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
    assert.isEmpty(response.data);
  });

  it('should return error as chain name is empty', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.chain = '';
    var brandedTokenObj = new platformServices.estimateGas(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
    assert.isEmpty(response.data);
  });

  it('should return error as sender name is empty', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.sender_address = '';
    var brandedTokenObj = new platformServices.estimateGas(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
    assert.isEmpty(response.data);
  });

  it('should return error as sender address is empty', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.sender_address = '';
    var brandedTokenObj = new platformServices.estimateGas(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
    assert.isEmpty(response.data);
  });

  it('should return error as sender address is invalid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.sender_address = '0xyf73';
    var brandedTokenObj = new platformServices.estimateGas(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
    assert.isEmpty(response.data);
  });

  it('should return error as method name is empty', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.method_name = '';
    var brandedTokenObj = new platformServices.estimateGas(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
    assert.isEmpty(response.data);
  });

  it('should return error as method arguments is empty', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.method_arguments = '';
    var brandedTokenObj = new platformServices.estimateGas(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
    assert.isEmpty(response.data);
  });

  it('should return error as method arguments have negative amount', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.method_arguments = [configStrategy.OST_FOUNDATION_ADDR, '-100'];
    var brandedTokenObj = new platformServices.estimateGas(dupData),
      response = await brandedTokenObj.perform();
    assert.equal(response.isSuccess(), false);
    assert.isEmpty(response.data);
  });
});
