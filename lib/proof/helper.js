const ethUtils = require('ethereumjs-util');

const rootPrefix = '..'
  , AccountProof = require(rootPrefix + '/services/proof/account_proof');

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
    let path = Buffer.from(this._leftPad(storageIndex), 'hex');
    mappings.map(mapping => {
      path = Buffer.concat([Buffer.from(this._leftPad(mapping)), path])
    });

    return Buffer.from(ethUtils.sha3(Buffer.from(ethUtils.sha3(path), 'hex')), 'hex');
  },
  /**
   * @param stateRoot
   * @param contractAddress
   * @param db level db instace
   * @return {Promise<StorageRoot>}
   * @private
   */
  fetchStorageRoot: async function (stateRoot, contractAddress, db) {

    let accountProofInstance = new AccountProof(stateRoot, db);
    let accountProof = await accountProofInstance.perform(contractAddress);
    return '0x' + accountProof.value[3].toString('hex');
  }
};

module.exports = new ProofHelperKlass();