const sinon = require('sinon')
  , mock = require('mock-require')
  , ethUtils = require('ethereumjs-util')
  , rootPrefix = "../..";


function TestUtil() {

}

TestUtil.prototype = {

  mockCustomRequireDependency: function (MockAccountProofBuild, MockStorageProofBuild) {
    delete require.cache;
    mock(rootPrefix + '/lib/proof/storage_proof', function MockStorageProof() {
      return {
        perform: async function () {
          MockStorageProofBuild();
          return {};
        }
      };
    });
    mock(rootPrefix + '/lib/proof/account_proof', function MockAccountProof() {
      return {
        perform: async function () {
          MockAccountProofBuild();
          return {};
        }
      }
    });
    mock(rootPrefix + '/lib/db/leveldb', {
      getInstance: sinon.fake()
    });

    mock(rootPrefix + '/lib/proof/helper', {
      fetchStorageRoot: sinon.fake()
    });
  },

  unMockCustomRequireDependency: function () {

    mock.stop(rootPrefix + '/lib/proof/account_proof');
    mock.stop(rootPrefix + '/lib/proof/storage_proof');
    mock.stop(rootPrefix + '/lib/db/leveldb');
  },
  accountValue: function (account) {
    let decodedAccount = this.decodeValue(account);
    return {
      key: decodedAccount[0],
      value: decodedAccount[1]
    };
  },

  decodeValue: function (value) {
    return ethUtils.rlp.decode(Buffer.from(value, 'hex'));
  },

  decodeParentNodes: function (value) {
    let formatedNode = [];
    ethUtils.rlp.decode(Buffer.from(value, 'hex')).map(node => formatedNode.push({raw: node}));
    return formatedNode;
  }
}

module.exports = new TestUtil();
