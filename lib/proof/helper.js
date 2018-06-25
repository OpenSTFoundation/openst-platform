const ethUtils = require('ethereumjs-util');

const rootPrefix = '../..'
  , AccountProof = require(rootPrefix + '/lib/proof/account_proof')
;

/**
 * Constructor for helper methods class - ProofHelperKlass
 *
 * @constructor
 */

const ProofHelperKlass = function () {
};

ProofHelperKlass.prototype = {

  _leftPad: function (value) {
    return ("0000000000000000000000000000000000000000000000000000000000000000" + value).substring(value.length)
  },
  /**
   *
   * @param storageIndex
   * @param mappings
   * @return {Buffer2}
   */
  storagePath: function (storageIndex, mappings) {
    storageIndex = Buffer.from(this._leftPad(storageIndex), 'hex')
    let path = storageIndex
    if (mappings.length > 0) {
      mappings.map(mapping => {
        path = Buffer.concat([Buffer.from(this._leftPad(mapping), 'hex'), path])
      });
      path = Buffer.from(ethUtils.sha3(path), 'hex')
    }
    path = Buffer.from(ethUtils.sha3(path), 'hex');
    return path;
  },

  /**
   * @param stateRoot
   * @param contractAddress
   * @param db level db instace
   * @return {Promise<string>}
   * @private
   */
  fetchStorageRoot: async function (stateRoot, contractAddress, db) {

    let accountProofInstance = new AccountProof(stateRoot, db);
    let accountProof = await accountProofInstance.perform(contractAddress);
    return '0x' + accountProof.value[2].toString('hex');
  }
};

module.exports = new ProofHelperKlass();