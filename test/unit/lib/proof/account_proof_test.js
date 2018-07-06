const assert = require('assert')
  , sinon = require('sinon')
;

const rootPrefix = "../../../.."
  , proof = require(rootPrefix + '/test/unit/data/accountProof')
  , utils = require(rootPrefix + '/test/unit/utils');

function mockedTrie(proof, generateValidProof = true) {
  return {
    findPath: function (path, callback) {
      callback(null, generateValidProof ? utils.accountValue(proof.accountNode) : undefined, "", utils.decodeParentNodes(proof.rlpParentNodes));
    },
    root: Buffer.from(proof.root, 'hex')
  };
}

describe('account proof for single node', function () {
  let accountProofInstance, AccountProofKlass,accountProof;
  before(async () => {
    AccountProofKlass = require(rootPrefix + '/lib/proof/account_proof')

    let mockDB = sinon.mock()
      , mockTrie = mockedTrie(proof[0]);

    accountProofInstance = new AccountProofKlass('0x47126c8821b7ce98c62dc6f392c91f37bf53f136580a4cb76041f96f1d6afb9b', mockDB);
    accountProofInstance.trie = mockTrie;
    accountProof = await accountProofInstance.perform(proof[0].address).then(proof => {
      return proof;
    });

  });

  it('should generate account proof for single node tree', function () {
    accountProof = accountProof.toHash().data;
    assert.equal(accountProof.address, proof[0].address);
    assert.equal(accountProof.parentNodes, proof[0].rlpParentNodes);
    assert.equal(accountProof.value, proof[0].nodes[0].rlpValue.slice(2));
  });
});

describe('account proof for multiple nodes(branch, leaf, extension)', function () {

  let AccountProof, accountProofInstance;

  before(async () => {

    AccountProof = require(rootPrefix + '/lib/proof/account_proof');
    let mockTrie = mockedTrie(proof[1])
      , mockDB = sinon.mock();
    accountProofInstance = new AccountProof('0x47126c8821b7ce98c62dc6f392c91f37bf53f136580a4cb76041f96f1d6afb9b', mockDB);
    accountProofInstance.trie = mockTrie;

  });

  it('should generate account proof for single node tree', async function () {

    let accountProof = await accountProofInstance.perform(proof[1].address).then(accountProof => {
      return accountProof;
    });
    accountProof = accountProof.toHash().data;
    assert.equal(accountProof.address, proof[1].address);
    assert.equal(accountProof.parentNodes, proof[1].rlpParentNodes);
    assert.equal(accountProof.value, proof[1].nodes[1].rlpValue.slice(2));
  });

  it('Should fail if account address is not passed in generate proof', async function () {

    try {
      await accountProofInstance.perform('1234abcdef3424');
    } catch (error) {
      assert.equal(error.params.api_error_identifier, 'account_address_undefined');
    }

  });
  it('Should fail if wrong account address is  passed', async function () {

    let accountProofInstance = new AccountProof('0x47126c8821b7ce98c62dc6f392c91f37bf53f136580a4cb76041f96f1d6afb9b');

    accountProofInstance.trie = mockedTrie(proof[1], false);
    try {
      await accountProofInstance.perform('1234abcdef3424');
    } catch (error) {
      assert.equal(error.params.api_error_identifier, 'account_node_not_found');
    }
  });

});









