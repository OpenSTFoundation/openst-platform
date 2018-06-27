const sinon = require('sinon')
  , mock = require('mock-require')
  , assert = require('assert')
  , ethUtils = require('ethereumjs-util')
  , rootPrefix = "../../.."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

let helper;

describe('Proof helper', function () {

  before(async () => {
    function MockAccountProof() {
    }

    MockAccountProof.prototype.perform = async function () {
      let rlpValue = ethUtils.rlp.encode([Buffer.from('1',), Buffer.from('2'), Buffer.from('3'), Buffer.from('4')]);
      return Promise.resolve(responseHelper.successWithData({value: rlpValue.toString('hex')}));
    };
    mock(rootPrefix + '/lib/proof/account_proof', MockAccountProof);
    helper = require(rootPrefix + '/lib/proof/helper');
  });

  it('should left pad data ', function () {

    let value = '123445';
    let expectedValue = '0000000000000000000000000000000000000000000000000000000000123445';
    let leftPaddedResult = helper._leftPad(value);
    assert.equal(leftPaddedResult.length, 64);
    assert.equal(leftPaddedResult, expectedValue);
  });

  it('should not left pad data which is already 32 bytes long ', function () {

    let value = '0000000000000000000000000000000000000000000000000000000000123445';
    let leftPaddedResult = helper._leftPad(value);
    assert.equal(leftPaddedResult.length, 64);
    assert.equal(leftPaddedResult, value);
  });

  it('should generate storage Path for non mapping type of variable', function () {

    let storageIndex = '00';
    let path = helper.storagePath(storageIndex);
    let expectedPath = '290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563';
    assert.equal(path instanceof Buffer, true);
    assert.equal(path.toString('hex'), expectedPath);
  });

  it('should generate storage Path for mapping type of variable', function () {

    let storageIndex = '00';
    let mapping = ['12345'];
    let expectedPath = '707183446ad8c4999f467457dec3371170121949badc558cc2e67f4e4cd7fb12';
    let path = helper.storagePath(storageIndex, mapping);
    assert.equal(path instanceof Buffer, true);
    assert.equal(path.toString('hex'), expectedPath);
  });

  it('should generate storage root for an contract', async function () {

    let contractAddress = '0x47126c8821b7ce98c62dc6f392c91f37bf53f136580a4cb76041f96f1d6afb9b';
    let stateRoot = '0x47126c8821b7ce98c62dc6f392c91f37bf53f136580a4cb76041f96f1d6afb9b';
    let mockDB = sinon.fake();

    let storageRoot = await helper.fetchStorageRoot(stateRoot, contractAddress, mockDB);
    assert.equal(storageRoot, '0x'+Buffer.from('3').toString('hex'))
  });


  after(async () => {
    mock.stop(rootPrefix + '/lib/proof/account_proof');
  });
});