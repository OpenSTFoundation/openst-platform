const rootPrefix = ".."
  , ethUtils = require('ethereumjs-util')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstants = require(rootPrefix + '/config/core_constants')
;

/**
 * Generate Account proof for give address in merkel patricia tree
 * @param address
 * @param trie
 * @return {Promise<proof>}
 */
module.exports.accountProof = function (address, trie) {

  let errorConf = {
    internal_error_identifier: "l_p_accountProof_1",
    debug_options: {},
    error_config: coreConstants.ERROR_CONFIG
  };

  let path = Buffer.from(ethUtils.sha3(Buffer.from(address, 'hex')), 'hex')
  logger.info('Generating account proof');
  return new Promise(function (resolve, reject) {

    return trie.findPath(path, function (error, accountNode, keyRemainder, rootToLeafPath) {
      if (error || !accountNode || keyRemainder.length > 0) {
        errorConf.api_error_identifier = "account_node_not_found";
        errorConf.debug_options = {error};
        let errorResponse = responseHelper.error(errorConf);
        return reject(errorResponse);
      }
      let parentNodes = rootToLeafPath.map(node => node.raw);
      let proof = {
        address: address,
        parentNodes: parentNodes,
        value: ethUtils.rlp.decode(accountNode.value)
      };
      return resolve(proof);
    });
  });
};

module.exports.storageProof = async function (storagePath, trie) {

  let errorConf = {
    internal_error_identifier: "l_p_accountProof_2",
    debug_options: {},
    error_config: coreConstants.ERROR_CONFIG
  };

  return new Promise(function (resolve, reject) {
    return trie.findPath(storagePath, function (error, storageNode, keyRemainder, rootToLeafPath) {

      if (error || !storageNode || keyRemainder.length > 0) {
        logger.error(error || 'Unable to find storage node in the tree');
        errorConf.api_error_identifier = "storage_node_not_found";
        errorConf.debug_options = {error};
        let errorResponse = responseHelper.error(errorConf);
        return reject(errorResponse);
      }
      let parentNodes = rootToLeafPath.map(node => node.raw);
      //todo- need to discuss on all return values
      let proof = {
        parentNodes: parentNodes,
        value: ethUtils.rlp.decode(storageNode.value)
      };
      return resolve(proof);
    })
  });
};


