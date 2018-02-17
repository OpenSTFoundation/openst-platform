// Load external packages
const chai = require('chai')
  , assert = chai.assert
  , Path = require('path')
  , os = require('os')
;

// Load cache service
const rootPrefix = "../.."
  , openstPlatform = require(rootPrefix + '/index')
  , platformServices = openstPlatform.services.transaction
  , web3ProviderFactory = require(rootPrefix + '/lib/web3/providers/factory')
  , brandedTokenConfigPath = os.homedir() + "/openst-setup/branded_tokens.json"
  , brandedTokenConfig = require(brandedTokenConfigPath)
;

var testValidData = {
  chain: 'utility',
  transaction_hash: '0xfa235356d336bc16fbb50c274adbde2ab35e7a6de6e70b2339d018f0feff4db1'
};

describe('services/transaction/get_receipt', function() {

  it('should return promise', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));

    var getReceiptObj = new platformServices.getReceipt(dupData)
      , response = getReceiptObj.perform()
    ;
    assert.typeOf(response, 'Promise');
  });

  it('should fail when params is undefined', async function() {
    var dupData = undefined;

    var getReceiptObj = new platformServices.getReceipt(dupData)
      , response = await getReceiptObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is a string', async function() {
    var dupData = 'abc';

    var getReceiptObj = new platformServices.getReceipt(dupData)
      , response = await getReceiptObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is empty object', async function() {
    var dupData = {};

    var getReceiptObj = new platformServices.getReceipt(dupData)
      , response = await getReceiptObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when params is empty array', async function() {
    var dupData = [];

    var getReceiptObj = new platformServices.getReceipt(dupData)
      , response = await getReceiptObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when chain is invalid and transaction_hash is invalid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.transaction_hash = 'my-tx';
    dupData.chain = 'my-chain';

    var getReceiptObj = new platformServices.getReceipt(dupData)
      , response = await getReceiptObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when chain is valid and transaction_hash is invalid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.transaction_hash = 'my-tx';

    var getReceiptObj = new platformServices.getReceipt(dupData)
      , response = await getReceiptObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when chain is invalid and transaction_hash is valid', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));
    dupData.chain = 'my-chain';

    var getReceiptObj = new platformServices.getReceipt(dupData)
      , response = await getReceiptObj.perform()
    ;
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when chain is valid and transaction_hash is valid but not mined', async function() {
    var dupData = JSON.parse(JSON.stringify(testValidData));

    var getReceiptObj = new platformServices.getReceipt(dupData)
      , response = await getReceiptObj.perform()
    ;
    assert.equal(response.isSuccess(), true);
    assert.deepEqual(response.data, {});
  });

  it('should pass when chain is valid and transaction_hash is valid and mined', async function() {
    // // Generate a trnsaction hash
    // var senderName = 'utilityChainOwner'
    //   , recipientName = 'staker'
    //   , amountInWei = 20
    //   , simpleTokenPrimeObj = new platformServices.transfer.simpleTokenPrime(
    //       {sender_name: senderName, recipient_name: recipientName, amount_in_wei: amountInWei}
    //     )
    //   , response = await simpleTokenPrimeObj.perform()
    // ;
    // console.log(response);
    // TODO: How to get a pre-mined transaction hash here?
    // var transaction_hash = '0xfa235356d336bc16fbb50c274adbde2ab35e7a6de6e70b2339d018f0feff4db1'
    //   , chain = 'utility'
    //   , getReceiptObj = new platformServices.getReceipt({chain: chain, transaction_hash: transaction_hash})
    //   , response = await getReceiptObj.perform()
    // ;
    // assert.equal(response.isSuccess(), false);
  });

});