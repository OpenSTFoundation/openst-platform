/**
 *
 * Test for Generate Address Utility Service
 *
 */

// Load external packages
const chai = require('chai')
  , assert = chai.assert;

// Load cache service
const rootPrefix = "../.."
  , OpenstPlatform = require(rootPrefix + '/index')
  , setupHelper = require(rootPrefix + '/tools/setup/helper')
  , configStrategy = require(setupHelper.configStrategyFilePath())
  , openstPlatform = new OpenstPlatform(configStrategy)
  , platformServices = openstPlatform.services.utils
  , InstanceComposer = require(rootPrefix + "/instance_composer")
  , instanceComposer = new InstanceComposer(configStrategy)
;

require(rootPrefix + '/lib/web3/providers/factory');

var testValidData = {
  chain: 'utility',
  passphrase: 'my-passphrase'
};

describe('services/utils/generate_address', function () {
  
  it('should return promise', async function () {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    
    var generateAddressObj = new platformServices.generateAddress(dupData)
      , response = generateAddressObj.perform()
    ;
    assert.typeOf(response, 'Promise');
  });
  
  it('should fail when params is undefined', async function () {
    var dupData = undefined;
    
    var generateAddressObj = new platformServices.generateAddress(dupData)
      , response = await generateAddressObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });
  
  it('should fail when params is a string', async function () {
    var dupData = 'acb';
    
    var generateAddressObj = new platformServices.generateAddress(dupData)
      , response = await generateAddressObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });
  
  it('should fail when params is empty object', async function () {
    var dupData = {};
    
    var generateAddressObj = new platformServices.generateAddress(dupData)
      , response = await generateAddressObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });
  
  it('should fail when params is empty array', async function () {
    var dupData = [];
    
    var generateAddressObj = new platformServices.generateAddress(dupData)
      , response = await generateAddressObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });
  
  it('should fail when invalid chain is set', async function () {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.chain = 'my-utility';
    
    var generateAddressObj = new platformServices.generateAddress(dupData)
      , response = await generateAddressObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });
  
  it('should pass when chain is valid and passphrase is set', async function () {
    
    let web3ProviderFactory = instanceComposer.getWeb3ProviderFactory();
    
    var dupData = JSON.parse(JSON.stringify(testValidData));
    
    var generateAddressObj = new platformServices.generateAddress(dupData)
      , response = await generateAddressObj.perform()
    ;
    assert.equal(response.isSuccess(), true);
    
    // unlock account
    const web3Provider = web3ProviderFactory.getProvider(dupData.chain, web3ProviderFactory.typeWS);
    var unlocked = await web3Provider.eth.personal.unlockAccount(response.data.address, dupData.passphrase);
    assert.equal(unlocked, true);
  });
  
  it('should pass when chain is valid and passphrase is not set', async function () {
    
    let web3ProviderFactory = instanceComposer.getWeb3ProviderFactory();
    
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.passphrase = '';
    
    var generateAddressObj = new platformServices.generateAddress(dupData)
      , response = await generateAddressObj.perform()
    ;
    assert.equal(response.isSuccess(), true);
    
    // unlock account
    const web3Provider = web3ProviderFactory.getProvider(dupData.chain, web3ProviderFactory.typeWS);
    var unlocked = await web3Provider.eth.personal.unlockAccount(response.data.address, dupData.passphrase);
    assert.equal(unlocked, true);
  });
  
});