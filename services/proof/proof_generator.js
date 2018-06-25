const rootPrefix = "../.."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , AccountProof = require(rootPrefix + '/lib/proof/account_proof')
  , StorageProof = require(rootPrefix + '/lib/proof/storage_proof')
  , dbFactory = require(rootPrefix + '/lib/db/leveldb')
  , helper = require(rootPrefix + '/lib/proof/helper')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstants = require(rootPrefix + '/config/core_constants')
;

/**
 * @param stateRoot
 * @param chainDataPath
 * @constructor
 */
function ProofGenerator(stateRoot, chainDataPath) {
  let oThis = this;
  oThis.db = dbFactory.getInstance(chainDataPath);
  oThis.stateRoot = stateRoot;
}

ProofGenerator.prototype = {

  /**
   *Build account proof
   * @param address
   * @return Promise<accountProof>
   */
  buildAccountProof: function (address) {
    let oThis = this;

    let accountProof = new AccountProof(oThis.stateRoot, oThis.db);
    logger.info(`Building account proof for address the ${address}`);
    return accountProof.perform(address);
  },

/**
 * @param contractAddress
 * @param storageIndex
 * @param mappingKeys
 * @Optional param  key for mapping variable type
 * @return {*|Promise<list<proof>}
 */
buildStorageProof: async function (contractAddress, storageIndex, mappingKeys) {
  let oThis = this;
  let proofPromises = [];

  this._validate(mappingKeys);

  logger.info(`Building storage proof for address the ${contractAddress} and storage Index ${storageIndex}`);
  let storageRoot = await helper.fetchStorageRoot(oThis.stateRoot, contractAddress, oThis.db);

  let storageProof = new StorageProof(storageRoot, contractAddress, oThis.db);

  if (mappingKeys === undefined || mappingKeys.length === 0) {
    proofPromises.push(await storageProof.perform(storageIndex));
    return Promise.resolve(proofPromises);
  }
  for (let i = 0; i < mappingKeys.length; i++) {
    proofPromises.push(await storageProof.perform(storageIndex, mappingKeys[i]));
  }
  return Promise.resolve(proofPromises);
},

  _validate: function (mappingKeys) {

    if (mappingKeys && mappingKeys.length > coreConstants.PROOF_BATCH_SIZE) {
      let error = responseHelper.error({
        internal_error_identifier: 's_pg_bsp_validate_1',
        api_error_identifier: 'proof_batch_size_exceeds',
        error_config: coreConstants.ERROR_CONFIG
      });
      return Promise.reject(error);
    }
  }

};

module.exports = ProofGenerator;


