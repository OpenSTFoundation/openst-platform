const assert = require('assert')
  , ethUtils = require('ethereumjs-util')
  , sinon = require('sinon')
;

const rootPrefix = "../../.."
  , proof = require(rootPrefix + '/test/data/accountProof')
  , utils = require(rootPrefix + '/test/utils');

function mockedTrie(proof, generateValidProof = true) {
  return {
    findPath: function (path, callback) {
      callback(null, generateValidProof ? utils.accountValue(proof.accountNode) : undefined, "", utils.decodeParentNodes(proof.rlpParentNodes));
    },
    root: Buffer.from(proof.root, 'hex')
  };
}

describe('account proof for single node', function () {
  let accountProofInstance, AccountProof,accountProof;
  before(async () => {
    AccountProof = require(rootPrefix + '/lib/proof/account_proof')

    let mockDB = sinon.mock();
    let mockTrie = mockedTrie(proof[0]);

    accountProofInstance = new AccountProof('0x47126c8821b7ce98c62dc6f392c91f37bf53f136580a4cb76041f96f1d6afb9b', mockDB);
    accountProofInstance.trie = mockTrie;
    accountProof = await accountProofInstance.perform(proof[0].address).then(proof => {
      return proof;
    });

  });

  it('should generate account proof for single node tree', function () {
    let decodedAccountNode = ethUtils.rlp.decode(proof[0].nodes[0].rlpValue);

    assert.equal(accountProof.parentNodes.length, 1);
    assert.equal(accountProof.address, proof[0].address);
    assert.equal(accountProof.value.length, 4);

    //assert accountNodeValue
    assert.equal(accountProof.value[0].equals(decodedAccountNode[0]), true);
    assert.equal(accountProof.value[1].equals(decodedAccountNode[1]), true);
    assert.equal(accountProof.value[2].equals(decodedAccountNode[2]), true);
    assert.equal(accountProof.value[3].equals(decodedAccountNode[3]), true);

  });
});

describe('account proof for multiple nodes(branch, leaf, extension)', function () {

  const accountAddress = proof[1].address;
  let AccountProof, accountProofInstance;

  before(async () => {

    AccountProof = require(rootPrefix + '/lib/proof/account_proof')
    let mockTrie = mockedTrie(proof[1]);
    let mockDB = sinon.mock();
    accountProofInstance = new AccountProof('0x47126c8821b7ce98c62dc6f392c91f37bf53f136580a4cb76041f96f1d6afb9b', mockDB);
    accountProofInstance.trie = mockTrie;

  });

  it('should generate account proof for single node tree', async function () {

    let accountProof = await accountProofInstance.perform(proof[1].address).then(accountProof => {
      return accountProof;
    });

    let decodedAccountNode = ethUtils.rlp.decode(proof[1].nodes[1].rlpValue);
    assert.equal(accountProof.parentNodes.length, 3);
    assert.equal(accountProof.address, accountAddress);
    assert.equal(accountProof.value.length, 4);

    //assert accountNodeValue
    assert.equal(accountProof.value[0].equals(decodedAccountNode[0]), true);
    assert.equal(accountProof.value[1].equals(decodedAccountNode[1]), true);
    assert.equal(accountProof.value[2].equals(decodedAccountNode[2]), true);
    assert.equal(accountProof.value[3].equals(decodedAccountNode[3]), true);
  });

  it('Should fail if account address is not passed in generate proof', async function () {
    let result = await accountProofInstance.perform();
    assert.equal(result.params.api_error_identifier, 'account_address_undefined');
  });
  it('Should fail if wrong account address is  passed', async function () {

    let mockTrie = mockedTrie(proof[1], false);

    let accountProofInstance = new AccountProof('0x47126c8821b7ce98c62dc6f392c91f37bf53f136580a4cb76041f96f1d6afb9b');
    accountProofInstance.trie = mockTrie;

    let result = await accountProofInstance.perform('1234abcdef3424');
    assert.equal(result.params.api_error_identifier, 'account_node_not_found');
  });

});









