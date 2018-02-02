"use strict";
/**
 * Geth process setup
 *
 * @module tools/setup/geth_manager
 */

const shell = require('shelljs')
  , editJsonFile = require("edit-json-file")
  , Path = require('path')
;

const rootPrefix = "../.."
  , setupConfig = require(rootPrefix + '/tools/setup/config')
  , setupHelper = require(rootPrefix + '/tools/setup/helper')
  , fileManager = require(rootPrefix + '/tools/setup/file_manager')
  , coreConstants = require(rootPrefix + '/config/core_constants')
;

const tempGethFolder = 'tmp-geth'
  , keystoreFolder = 'keystore'
  , tempPasswordFile = 'tmp_password_file'
  , allocBalancesOn = {utility: coreConstants.OST_UTILITY_STPRIME_TOTAL_SUPPLY, value: '1000000'}
  , gasLimitOn = {utility: coreConstants.OST_UTILITY_GAS_LIMIT, value: coreConstants.OST_VALUE_GAS_LIMIT}
  , hexStartsWith = '0x'
  , genesisTemplateLocation = Path.join(__dirname)
;

/**
 * Constructor for geth manager
 *
 * @constructor
 */
const GethManagerKlass = function () {};

GethManagerKlass.prototype = {


  /**
   * Do the build clean up
   */
  buildCleanup: function() {
    const oThis = this;

    // remove tmp geth
    fileManager.rm(tempGethFolder);
  },

  /**
   * Get chain data dir absolute path
   *
   * @return {string}
   */
  getChainAbsoluteDataDir: function(chain) {
    const oThis = this;
    return setupHelper.testFolderAbsolutePath() + '/' + oThis.getChainDataFolder(chain);
  },

  /**
   * Get chain data folder name
   *
   * @return {string}
   */
  getChainDataFolder: function(chain) {
    return setupConfig.chains[chain].folder_name;
  },

  /**
   * Generate all required addresses in temp geth data dir
   */
  generateConfigAddresses: function() {
    const oThis = this;

    // create temp geth folder
    fileManager.mkdir(tempGethFolder);

    // create all required addresses in tmp geth data dir
    for (var name in setupConfig.addresses) {
      var nameDetails = setupConfig.addresses[name];
      nameDetails.address.value = oThis._generateAddress(tempGethFolder, nameDetails.passphrase.value);
    }

  },

  /**
   * Initialize chain
   *
   * @param {string} chain - name of the chain
   */
  initChain: function(chain) {
    const oThis = this
      , chainFolder = oThis.getChainDataFolder(chain)
      , chainDataDir = oThis.getChainAbsoluteDataDir(chain)
      , chainGenesisTemplateLocation = genesisTemplateLocation + '/genesis-'+chain+'.json'
      , chainGenesisLocation = chainDataDir + '/genesis-'+chain+'.json'
    ;

    // create chain folder
    fileManager.mkdir(chainFolder);

    // copy genesis template file in chain folder
    fileManager.exec('cp ' + chainGenesisTemplateLocation +' ' + chainGenesisLocation);

    // Alloc balance in genesis files
    oThis._modifyGenesisFile(chain, chainGenesisLocation);

    // Alloc balance in genesis files
    oThis._initChain(chain, chainDataDir, chainGenesisLocation);
  },

  /**
   * Move keystore files from temp geth to required geth instances
   *
   * @return {object}
   */
  copyKeystoreToChains: function() {
    const oThis = this;

    // copy all keystore files from temp location to required location
    for (var name in setupConfig.addresses) {
      var nameDetails = setupConfig.addresses[name]
        , keystoreFileNameLike = nameDetails.address.value.replace(hexStartsWith, '*')
      ;
      for (var chain in nameDetails.chains) {
        var chainFolder = oThis.getChainDataFolder(chain)
          , fromFolder = tempGethFolder + '/' + keystoreFolder
          , toFolder = chainFolder + '/' + keystoreFolder
        ;
        fileManager.cp(fromFolder, toFolder, keystoreFileNameLike);
      }
    }
  },

  /**
   * Modify genesis file
   *
   * @param {string} chain - name of the chain
   * @param {string} chainGenesisLocation - genesis file location to be modified
   *
   * @return {boolean}
   * @private
   */
  _modifyGenesisFile: function(chain, chainGenesisLocation) {
    const chainId = setupConfig.chains[chain].chain_id.value
      , allocBalanceToAddrName = setupConfig.chains[chain].alloc_balance_to_addr
      , allocAmountToAddress = setupConfig.addresses[allocBalanceToAddrName].address.value
      , allocAmount = hexStartsWith + allocBalancesOn[chain].toString(16)
      , gasLimit = hexStartsWith + gasLimitOn[chain].toString(16)
      , sealerAddress = setupConfig.addresses['sealer'].address.value
      , extraData = "0x0000000000000000000000000000000000000000000000000000000000000000" + sealerAddress.replace(hexStartsWith, '') + "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    ;

    // If the file doesn't exist, the content will be an empty object by default.
    const file = editJsonFile(chainGenesisLocation);

    // Alloc balance to required address
    file.set("alloc." + allocAmountToAddress + ".balance", allocAmount);

    // set chain id
    file.set("config.chainId", chainId);

    // set gas limit
    file.set("gasLimit", gasLimit);

    // add extra data
    if (chain == 'utility') {
      file.set("extraData", extraData);
    }

    file.save();

    return true;
  },

  /**
   * Modify genesis file
   *
   * @param {string} chain - name of the chain
   * @param {string} chainDataDir - chain data dir
   * @param {string} chainGenesisLocation - genesis file location
   *
   * @return {object}
   * @private
   */
  _initChain: function(chain, chainDataDir, chainGenesisLocation) {
    fileManager.exec('geth --datadir "' + chainDataDir + '" init ' + chainGenesisLocation);
  },

  /**
   * Generate keystore in required data dir
   *
   * @param {string} relativeDataDir - relative geth data dir path
   * @param {string} passphrase - account passphrase
   *
   * @return {string} - new account address
   * @private
   */
  _generateAddress: function(relativeDataDir, passphrase) {
    const tmpPasswordFilePath = relativeDataDir + '/' + tempPasswordFile
      , absoluteDirPath = setupHelper.testFolderAbsolutePath() + '/' + relativeDataDir;

    // creating password file in a temp location
    fileManager.touch(tmpPasswordFilePath, passphrase);

    // generate keystore file and address
    const cmd = 'geth --datadir "' + absoluteDirPath + '" account new --password ' +
      setupHelper.testFolderAbsolutePath() + '/' + tmpPasswordFilePath;
    var addressGerationResponse = fileManager.exec(cmd);

    // remove password
    fileManager.rm(tmpPasswordFilePath);

    // parsing the response to get address
    return addressGerationResponse.stdout.replace("Address: {", hexStartsWith).replace("}", "").trim();
  }
};

module.exports = new GethManagerKlass();
