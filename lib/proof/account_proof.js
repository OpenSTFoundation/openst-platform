const Trie = require('merkle-patricia-tree');

const rootPrefix = "../.."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , proof = require(rootPrefix + "/lib/proof/proof")
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

/**
 * @constructor
 * @param stateRoot
 * @param db
 */
function AccountProof(stateRoot, db) {
  const oThis = this;

  oThis.trie = new Trie(db, stateRoot);
}

AccountProof.prototype = {

  /**
   * Validate and _build proof
   * @param address
   * @return {Promise<proof>}
   */
  perform: async function (address) {
    const oThis = this;

    await oThis._validate(address);
    return oThis._build(address);
  },
  /**
   * Delegates call to _build account proof to lib
   * @param address
   * @return {Promise<proof>}
   */
  _build: async function (address) {
    const oThis = this;

    return proof.accountProof(address, oThis.trie);
  },
  /**
   * Validate input
   * @param address
   * @private
   */
  _validate: async function (address) {

    let oThis = this;
    let errorConf = {
      internal_error_identifier: "s_p_ap_validate_2",
      debug_options: {},
      error_config: basicHelper.fetchErrorConfig()
    };

    if (!oThis.trie || oThis.trie.root === oThis.trie.EMPTY_TRIE_ROOT) {
      errorConf.api_error_identifier = "tree_not_initialized";
      let errorResponse = responseHelper.error(errorConf);
      return Promise.reject(errorResponse);
    }
    if (address === undefined) {
      logger.error("Account address is invalid");
      errorConf.api_error_identifier = "account_address_undefined";
      let errorResponse = responseHelper.error(errorConf);
      return Promise.reject(errorResponse);
    }
  }
};

module.exports = AccountProof;

