const assert = require('assert');

const rootPrefix = '../../../..'
  , proof = require(rootPrefix + '/lib/proof/proof')
  , utils = require(rootPrefix + '/test/unit/utils')
  , accountProofData = require(rootPrefix + '/test/unit/data/accountProof')
  , storageProofData = require(rootPrefix + '/test/unit/data/storageProof')
;


describe(' Account Proof', function () {


  function mockedAccountTrie(proof, generateValidProof = true) {
    return {
      findPath: function (path, callback) {
        callback(null, generateValidProof ? utils.accountValue(proof.accountNode) : undefined, "", utils.decodeParentNodes(proof.rlpParentNodes));
      },
      root: Buffer.from(proof.root, 'hex')
    };
  }


  it('should generate account proof ', async function () {
    let path = '2456F6369a9FCB3FE80a89Cd1Dd74108D86FA875'
      , mockTrie = mockedAccountTrie(accountProofData[1])
      , accountProof = await proof.accountProof(path, mockTrie);
    accountProof = accountProof.toHash().data;

    assert.equal(accountProof.parentNodes, accountProofData[1].rlpParentNodes);
    assert.equal(accountProof.value, accountProofData[1].nodes[1].rlpValue.slice(2));

  });

  it('should fail if account info not found in tree', async function () {
    let path = '2456F6369a9FCB3FE80a89Cd1Dd74108D86FA875'
      , mockTrie = mockedAccountTrie(accountProofData[1], false);
    try {
      await proof.accountProof(path, mockTrie);
    } catch (error) {
      assert.equal(error.params.api_error_identifier, 'account_node_not_found');
    }
  });

});

describe(' Storage Proof', function () {

  function mockedStorageTrie(proof, generateValidProof = true) {
    return {
      findPath: function (path, callback) {
        callback(null, generateValidProof ? {"value": Buffer.from(proof.value, 'hex')} : undefined, "", utils.decodeParentNodes(proof.rlpParentNodes));
      },
      root: Buffer.from(proof.root, 'hex')
    };
  }

  it('should generate storage proof ', async function () {
    let path = '2456F6369a9FCB3FE80a89Cd1Dd74108D86FA875'
      , mockTrie = mockedStorageTrie(storageProofData[1])
      , storageProof = await proof.storageProof(path, mockTrie);

    storageProof = storageProof.toHash().data;
    assert.equal(storageProof.value, storageProofData[1].value);
    assert.equal(storageProof.parentNodes, storageProofData[1].rlpParentNodes);

  });

  it('should fail if storage node not found', async function () {
    let path = '2456F6369a9FCB3FE80a89Cd1Dd74108D86FA875'
      , mockTrie = mockedStorageTrie(storageProofData[1], false);

    try {
      await proof.storageProof(path, mockTrie);
    } catch (error) {
      assert.equal(error.params.api_error_identifier, 'storage_node_not_found');
    }
  });

});