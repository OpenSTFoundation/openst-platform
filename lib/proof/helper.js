const ethUtils = require('ethereumjs-util');

const rootPrefix = '../..'
  , AccountProof = require(rootPrefix + '/lib/proof/account_proof')
;

/**
 * Constructor for helper methods class - ProofHelperKlass
 * @constructor
 */

const ProofHelperKlass = function () {
};

ProofHelperKlass.prototype = {

  /**
   * @notice left-pad value to make length 32 bytes
   * @param value
   * @return {string} padded value of length 32 bytes i.e. 64 nibbles
   * @private
   */
  _leftPad: function (value) {
    return ("0000000000000000000000000000000000000000000000000000000000000000" + value).substring(value.length)
  },
  /**
   *@notice generates storagePath of a variable in the storage
   * @param storageIndex
   * @param mappings, key of mapping variable
   * @return {Buffer2}
   */
  storagePath: function (storageIndex, mappings) {

    let path = Buffer.from(this._leftPad(storageIndex), 'hex');
    if (mappings && mappings.length > 0) {
      mappings.map(mapping => {
        path = Buffer.concat([Buffer.from(this._leftPad(mapping), 'hex'), path])
      });
      path = Buffer.from(ethUtils.sha3(path), 'hex')
    }
    path = Buffer.from(ethUtils.sha3(path), 'hex');
    return path;
  },

  /**
   * @notice generates storage root of a contract
   * @param stateRoot
   * @param contractAddress
   * @param db level db instace
   * @return {Promise<string>}
   * @private
   */
  fetchStorageRoot: async function (stateRoot, contractAddress, db) {

    let accountProofInstance = new AccountProof(stateRoot, db);
    let accountProof = await accountProofInstance.perform(contractAddress);
    let accountValue = accountProof.toHash().data.value;
    let decodedValue = ethUtils.rlp.decode('0x' + accountValue);
    return '0x' + decodedValue[2].toString('hex');
  }
};

module.exports = new ProofHelperKlass();