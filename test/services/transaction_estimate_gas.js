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
  contract_name: 'stPrime',
  contract_address: coreAddresses.getAddressForContract('stPrime'),
  chain: 'utility',
  senderAddress: configStrategy.OST_FOUNDATION_ADDR,
  methodName: 'transfer',
  methodArguments: [brandedTokenDetails['Reserve'], '100000000000']
};

describe('services/transaction/estimate_gas', function() {
  it('should return promise', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    //console.log('1111',configStrategy);
    var brandedTokenObj = new platformServices.estimateGas(dupData),
      response = brandedTokenObj.perform();
    assert.typeOf(response, 'Promise');
  });
});
