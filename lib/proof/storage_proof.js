

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , proof = require(rootPrefix + "/lib/proof/proof")
  , helper = require(rootPrefix + '/lib/proof/helper')
  , coreConstants = require(rootPrefix + '/config/core_constants')
;
/**
 * @constructor
 * @param stateRoot
 * @param contractAddress
 * @param db leveldb Instance
 */
function StorageProof(stateRoot, contractAddress, db) {
  let oThis = this;

  oThis.stateRoot = stateRoot;
  oThis.contractAddress = contractAddress;
  oThis.db = db;
}

StorageProof.prototype = {

  /**
   * @param storageIndex
   * @return {Promise<proof>}
   */
  perform: function (storageIndex) {
    let oThis = this;
    let mapping = Array.prototype.slice.call(arguments, 1);

    return oThis.asyncPerform(storageIndex, mapping).catch(function (error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 's_p_sp_validate_1',
          api_error_identifier: 'exception',
          error_config: coreConstants.ERROR_CONFIG
        });
      }
    });
  },

  /**
   * @param storageIndex
   * @param mapping key of key-value pair storage
   * @return {Promise<proof>}
   */
  asyncPerform: async function (storageIndex, mapping) {
    let oThis = this;

    await oThis._validate(storageIndex);
    let storagePath = helper.storagePath(storageIndex, mapping);
    return await oThis.build(storagePath);
  },

  /**
   * @param storagePath
   * @return {Promise<proof>}
   */
  build: async function (storagePath) {
    let oThis = this;

    oThis.storageTrie = await helper.fetchStorageTrie(oThis.stateRoot, oThis.contractAddress, oThis.db);
    return await proof.storageProof(storagePath, oThis.storageTrie);
  },

  /**
   * @param storageIndex
   * @private
   */
  _validate: async function (storageIndex) {

    let errorConf = {
      internal_error_identifier: "s_p_sp_validate_2",
      debug_options: {},
      error_config: coreConstants.ERROR_CONFIG
    };

    if (storageIndex === undefined) {
      logger.error("Storage Index is invalid");
      errorConf.api_error_identifier = "storage_index_undefined";
      let errorResponse = responseHelper.error(errorConf);
      return Promise.reject(errorResponse);
    }
  },

};

module.exports = StorageProof;

