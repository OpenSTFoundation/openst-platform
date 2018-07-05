const rootPrefix = "../.."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , AccountProof = require(rootPrefix + '/lib/proof/account_proof')
  , StorageProof = require(rootPrefix + '/lib/proof/storage_proof')
  , dbFactory = require(rootPrefix + '/lib/db/leveldb')
  , helper = require(rootPrefix + '/lib/proof/helper')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

/**
 * @param stateRoot
 * @param chainDataPath
 * @constructor
 */
function ProofGenerator(stateRoot, chainDataPath) {
  const oThis = this;

  oThis.db = dbFactory.getInstance(chainDataPath);
  oThis.stateRoot = stateRoot;
}

ProofGenerator.prototype = {

  /**
   *Build account proof
   * @param address for which account proof is needed
   * @return Promise<accountProof>
   */
  buildAccountProof: function (address) {
    const oThis = this;

    let accountProof = new AccountProof(oThis.stateRoot, oThis.db);
    logger.info(`Building account proof for address the ${address}`);
    return accountProof.perform(address).catch(function (error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 's_p_bap_validate_1',
          api_error_identifier: 'exception',
          error_config: basicHelper.fetchErrorConfig()
        });
      }
    });
  },

/**
 * @param contractAddress
 * @param storageIndex Position of variable in the contract
 * @param mappingKeys array of keys of mapping variable in the contract
 * @Optional param  key for mapping variable type
 * @return {*|Promise<map<key,proof>} in batch mode and Promise<proof> in non batch mode i.e. single non-mapping type variable
 */


buildStorageProof: async function (contractAddress, storageIndex, mappingKeys) {
  const oThis = this;
  let keyProofMap = {};

  let errorConf = {
    api_error_identifier: 'exception',
    error_config: basicHelper.fetchErrorConfig()
  };
  await oThis._validate(mappingKeys);

  logger.info(`Building storage proof for address the ${contractAddress} and storage Index ${storageIndex}`);
  let storageRoot = await helper.fetchStorageRoot(oThis.stateRoot, contractAddress, oThis.db)
    , storageProof = new StorageProof(storageRoot, contractAddress, oThis.db);

  if (mappingKeys === undefined || mappingKeys.length === 0) {
    let proof = await storageProof.perform(storageIndex).catch(function (error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(error);
        errorConf.internal_error_identifier = 's_p_sp_validate_1';
        return responseHelper.error(errorConf);
      }
    });

    return Promise.resolve(proof);
  }
  for (let i = 0; i < mappingKeys.length; i++) {
    keyProofMap[mappingKeys[i]] = await storageProof.perform(storageIndex, mappingKeys[i]).catch(function (error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(error);
        errorConf.internal_error_identifier = 's_p_sp_validate_2';
        return responseHelper.error(errorConf);
      }
    });
  }
  return Promise.all(keyProofMap);
},

  /**
   * Validation for storageProof generation
   * @param mappingKeys
   * @private
   */
  _validate: function (mappingKeys) {
    if (mappingKeys && mappingKeys.length > coreConstants.PROOF_BATCH_SIZE) {
      let error = responseHelper.error({
        internal_error_identifier: 's_pg_bsp_validate_1',
        api_error_identifier: 'proof_batch_size_exceeds',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.reject(error);
    }
  }

};

module.exports = ProofGenerator;


