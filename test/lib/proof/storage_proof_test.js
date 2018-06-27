const assert = require('assert')
  , sinon = require('sinon')
  , mock = require('mock-require')


const rootPrefix = "../../.."
  , proof = require(rootPrefix + '/test/data/storageProof')
  , utils = require(rootPrefix + '/test/utils');

function mockedTrie(proof, generateValidProof = true) {
  return {
    findPath: function (path, callback) {
      callback(null, generateValidProof ? {"value": Buffer.from(proof.value, 'hex')} : undefined, "", utils.decodeParentNodes(proof.rlpParentNodes));
    },
    root: Buffer.from(proof.root, 'hex')
  };
}

describe('should generate storage proof for  mapping type variable', function () {
  let storageProofInstance, StorageProof, storageProof;
  before(async () => {
    mock(rootPrefix + '/lib/proof/helper',
      {
        storagePath: () => Buffer.from(proof[1].path, 'hex')
      });

    StorageProof = require(rootPrefix + '/lib/proof/storage_proof');

    let mockDB = sinon.mock();
    let stateRoot = '0x47126c8821b7ce98c62dc6f392c91f37bf53f136580a4cb76041f96f1d6afb9b';
    let contractAddress = 'A040086e3072EDe0cEC46780394DEe1211Cbb1d6';

    storageProofInstance = new StorageProof(stateRoot, contractAddress, mockDB);
    storageProofInstance.trie = mockedTrie(proof[1]);
    storageProof = await storageProofInstance.perform(proof[1].storageIndex, proof[1].key).then(proof => {
      return proof;
    });
  });

  it('should generate storage proof for mapping type variable', function () {
    storageProof = storageProof.toHash().data;
    assert.equal(storageProof.value, proof[1].value);
    assert.equal(storageProof.parentNodes, proof[1].rlpParentNodes);
  });

  after(async () => {
    mock.stopAll();
  });
});










