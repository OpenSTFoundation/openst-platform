const Trie = require('merkle-patricia-tree');

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , proof = require(rootPrefix + "/lib/proof/proof")
  , helper = require(rootPrefix + '/lib/proof/helper')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;
/**
 * @constructor
 * @param storageRoot
 * @param contractAddress
 * @param db leveldb Instance
 */
function StorageProof(storageRoot, contractAddress, db) {
  let oThis = this;

  oThis.stateRoot = storageRoot;
  oThis.contractAddress = contractAddress;
  oThis.db = db;
  oThis.trie = new Trie(db, storageRoot);
}

StorageProof.prototype = {

  /**
   * @param storageIndex
   * @param optional argument mapping key of key-value pair storage
   * @return {Promise<proof>}
   */
  perform: async function (storageIndex) {
    let oThis = this;

    let mapping = Array.prototype.slice.call(arguments, 1);

    await oThis._validate(storageIndex);
    let storagePath = helper.storagePath(storageIndex, mapping);
    return await oThis._build(storagePath);
  },

  /**
   * @param storagePath
   * @return {Promise<proof>}
   */
  _build: async function (storagePath) {
    let oThis = this;
    return await proof.storageProof(storagePath, oThis.trie);
  },

  /**
   * @param storageIndex
   * @private
   */
  _validate: async function (storageIndex) {
    let oThis = this;

    let errorConf = {
      internal_error_identifier: "s_p_sp_validate_2",
      debug_options: {},
      error_config: basicHelper.fetchErrorConfig()
    };

    if (storageIndex === undefined) {
      logger.error("Storage Index is invalid");
      errorConf.api_error_identifier = "storage_index_undefined";
      let errorResponse = responseHelper.error(errorConf);
      return Promise.reject(errorResponse);
    }

    if (!oThis.trie || oThis.trie.root === oThis.trie.EMPTY_TRIE_ROOT) {
      errorConf.api_error_identifier = "tree_not_initialized";
      let errorResponse = responseHelper.error(errorConf);
      return Promise.reject(errorResponse);
    }
  },

};

module.exports = StorageProof;

