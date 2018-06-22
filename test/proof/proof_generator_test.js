const assert = require('assert')
  , sinon = require('sinon')
  , mock = require('mock-require')
  , rootPrefix = "../.."
  , utils = require(rootPrefix + '/test/utils');

let MockAccountProofBuild = sinon.fake()
  , MockStorageProofBuild = sinon.fake();


describe('generate Proof', function () {

  let ProofGenerator, proofGeneratorInstance;
  let root = '0x47126c8821b7ce98c62dc6f392c91f37bf53f136580a4cb76041f96f1d6afb9b';

  before(function () {
    utils.mockCustomRequireDependency(MockAccountProofBuild, MockStorageProofBuild);

    ProofGenerator = require(rootPrefix + '/services/proof/proof_generator');
    proofGeneratorInstance = new ProofGenerator(root, __dirname);
  });

  it('Should be able to generate accountProof', function () {

    let proofGenerator = new ProofGenerator(root, __dirname);
    proofGenerator.accountProof = proofGenerator.buildAccountProof('0x32344343546656e561234567556755');
    assert.equal(MockAccountProofBuild.called, true);
  });

  it('Should be able to generate storageProof', function () {

    let contractAddress = '0x47126c8821b7ce98c62dc6f392c91f37bf53f136580a4cb76041f96f1d6afb9b';
    let storageIndex = '01';

    proofGeneratorInstance.accountProof = proofGeneratorInstance.buildStorageProof(contractAddress, storageIndex);
    assert.equal(MockStorageProofBuild.called, true);
  });

  after(function () {
    utils.unMockCustomRequireDependency();
  });
});
