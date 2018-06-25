const sinon = require('sinon')
  , mock = require('mock-require')
  , ethUtils = require('ethereumjs-util')
  , rootPrefix = "../";

module.exports.mockCustomRequireDependency = function (MockAccountProofBuild, MockStorageProofBuild) {
  mock(rootPrefix + '/lib/proof/account_proof', function MockAccountProof() {
    return {
      perform: MockAccountProofBuild
    }
  });
  mock(rootPrefix + '/lib/proof/storage_proof', function MockStorageProof() {
    return {
      perform: MockStorageProofBuild
    };
  });
  mock(rootPrefix + '/lib/db/leveldb', {
    getInstance: sinon.fake()
  });
};

module.exports.unMockCustomRequireDependency = function () {

  mock.stop(rootPrefix + '/lib/proof/account_proof');
  mock.stop(rootPrefix + '/lib/proof/storage_proof');
  mock.stop(rootPrefix + '/lib/db/leveldb');
};


module.exports.accountValue = function (account) {
  let decodedAccount = this.decodeValue(account);
  return {
    key: decodedAccount[0],
    value: decodedAccount[1]
  };
};

module.exports.decodeValue = function (value) {
  return ethUtils.rlp.decode(Buffer.from(value, 'hex'));
};

module.exports.decodeParentNodes = function (value) {
  let formatedNode = [];
  ethUtils.rlp.decode(Buffer.from(value, 'hex')).map(node => formatedNode.push({raw: node}));
  return formatedNode;
};