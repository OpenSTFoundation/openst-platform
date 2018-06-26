const assert = require('assert')
  , ethUtils = require('ethereumjs-util');

const rootPrefix = '../../..'
  , proof = require(rootPrefix + '/lib/proof/proof')
  , utils = require(rootPrefix + '/test/utils')
  , accountProofData = require(rootPrefix + '/test/data/accountProof')
  , storageProofData = require(rootPrefix + '/test/data/storageProof')
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
    let path = '2456F6369a9FCB3FE80a89Cd1Dd74108D86FA875';
    let mockTrie = mockedAccountTrie(accountProofData[1]);
    let accountProof = await proof.accountProof(path, mockTrie);


    let decodedAccountNode = ethUtils.rlp.decode(accountProofData[1].nodes[1].rlpValue);
    assert.equal(accountProof.parentNodes.length, 3);
    assert.equal(accountProof.address, path);
    assert.equal(accountProof.value.length, 4);

    //assert accountNodeValue
    assert.equal(accountProof.value[0].equals(decodedAccountNode[0]), true);
    assert.equal(accountProof.value[1].equals(decodedAccountNode[1]), true);
    assert.equal(accountProof.value[2].equals(decodedAccountNode[2]), true);
    assert.equal(accountProof.value[3].equals(decodedAccountNode[3]), true);

  });

  it('should fail if account info not found in tree', async function () {
    let path = '2456F6369a9FCB3FE80a89Cd1Dd74108D86FA875';
    let mockTrie = mockedAccountTrie(accountProofData[1], false);
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
    let path = '2456F6369a9FCB3FE80a89Cd1Dd74108D86FA875';
    let mockTrie = mockedStorageTrie(storageProofData[1]);
    let storageProof = await proof.storageProof(path, mockTrie);

    assert.equal(storageProof.value.equals(utils.decodeValue(storageProofData[1].value)), true);
    assert.equal(storageProof.parentNodes.length, utils.decodeParentNodes(storageProofData[1].rlpParentNodes).length);

  });

  it('should fail if storage node not found', async function () {
    let path = '2456F6369a9FCB3FE80a89Cd1Dd74108D86FA875';
    let mockTrie = mockedStorageTrie(storageProofData[1], false);

    try {
      await proof.storageProof(path, mockTrie);
    } catch (error) {
      assert.equal(error.params.api_error_identifier, 'storage_node_not_found');
    }
  });

});