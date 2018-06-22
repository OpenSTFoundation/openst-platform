const rootPrefix = "../.."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , AccountProof = require(rootPrefix + '/services/proof/account_proof')
  , StorageProof = require(rootPrefix + '/services/proof/storage_proof')
  , dbFactory = require(rootPrefix + '/lib/db/leveldb');

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

/**
 *Build account proof
 * @param address
 * @return Promise<accountProof>
 */
ProofGenerator.prototype.buildAccountProof = function (address) {
  let oThis = this;

  let accountProof = new AccountProof(oThis.stateRoot, oThis.db);
  logger.info(`Building account proof for address the ${address}`);
  return accountProof.perform(address);
};

/**
 *
 * @param contractAddress
 * @param storageIndex
 * @Optional param  key for mapping variable type
 * @return {*|Promise<proof>}
 */
ProofGenerator.prototype.buildStorageProof = function (contractAddress, storageIndex) {
  let oThis = this;

  logger.info(`Building storage proof for address the ${contractAddress} and storage Index ${storageIndex}`);
  let storageProof = new StorageProof(oThis.stateRoot, contractAddress, oThis.db);
  let mapping = Array.prototype.slice.call(arguments, 2);
  return storageProof.perform(storageIndex, ...mapping);
};

module.exports = ProofGenerator;


