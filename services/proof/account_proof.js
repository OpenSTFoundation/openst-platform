const Trie = require('merkle-patricia-tree');

const rootPrefix = "../.."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , proof = require(rootPrefix + "/lib/proof/proof")
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
   *Generate proof and handles error
   * @param address
   * @return {Promise<proof>}
   */
  perform: function (address) {
    const oThis = this;

    return oThis.asyncPerform(address).catch(function (error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 's_p_ap_validate_1',
          api_error_identifier: 'exception',
          error_config: coreConstants.ERROR_CONFIG
        });
      }
    });

  },
  /**
   * Validate and build proof
   * @param address
   * @return {Promise<proof>}
   */
  asyncPerform: async function (address) {
    const oThis = this;

    await oThis._validate(address);
    return await oThis.build(address);
  },
  /**
   * Delegates call to build account proof to lib
   * @param address
   * @return {Promise<proof>}
   */
  build: async function (address) {
    const oThis = this;

    return await proof.accountProof(address, oThis.trie);
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
      error_config: coreConstants.ERROR_CONFIG
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

