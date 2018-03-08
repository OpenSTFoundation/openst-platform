"use strict";
/**
 * Geth process setup
 *
 * @module tools/setup/geth_manager
 */

const shell = require('shelljs')
  , editJsonFile = require("edit-json-file")
  , Path = require('path')
  , BigNumber = require('bignumber.js')
;

const rootPrefix = "../.."
  , setupConfig = require(rootPrefix + '/tools/setup/config')
  , setupHelper = require(rootPrefix + '/tools/setup/helper')
  , fileManager = require(rootPrefix + '/tools/setup/file_manager')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , Web3 = require('web3')
  , web3RpcUtilityProvider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , web3RpcValueProvider = require(rootPrefix + '/lib/web3/providers/value_rpc')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , generateRawKeyKlass = require(rootPrefix + '/services/utils/generate_raw_key')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

const tempGethFolder = 'tmp-geth'
  , keystoreFolder = 'keystore'
  , tempPasswordFile = 'tmp_password_file'
  , tempPrivateKeyFile = 'tmp_private_key_file'
  , gasLimitOn = {utility: coreConstants.OST_UTILITY_GAS_LIMIT, value: coreConstants.OST_VALUE_GAS_LIMIT}
  , hexStartsWith = '0x'
  , genesisTemplateLocation = Path.join(__dirname)
  , etherToWeiCinversion = new BigNumber(1000000000000000000)
  , preInitAddressName = [
    'sealer'
  ]
;

const allocBalancesOn = {
  utility: (new BigNumber(coreConstants.OST_UTILITY_STPRIME_TOTAL_SUPPLY)).mul(etherToWeiCinversion),
  value: (new BigNumber('1000000')).mul(etherToWeiCinversion)
};

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
    return setupHelper.setupFolderAbsolutePath() + '/' + oThis.getChainDataFolder(chain);
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
   * Generate all required addresses.
   *
   * @param options
   * @return {Object} Addresses generated
   */
  generateAddresses: function(options){
    const oThis = this;

    return oThis._createAddresses(options);
  },

  /**
   * Generate all required pre init addresses in temp geth data dir
   */
  generatePreInitAddresses: function() {
    const oThis = this;

    // create temp geth folder
    fileManager.mkdir(tempGethFolder);

    // create all required addresses in tmp geth data dir
    for (var i=0; i < preInitAddressName.length; i++) {
      var name = preInitAddressName[i]
        , nameDetails = setupConfig.addresses[name];
      logger.info("* " + name + " address: ");
      nameDetails.address.value = oThis._generatePreInitAddresses(tempGethFolder, nameDetails.passphrase.value);
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
    logger.info("* Creating " + chain + " folder");
    fileManager.mkdir(chainFolder);

    // copy genesis template file in chain folder
    logger.info("* Copying " + chain + " genesis template file");
    fileManager.exec('cp ' + chainGenesisTemplateLocation +' ' + chainGenesisLocation);

    // Alloc balance in genesis files
    logger.info("* Modifying " + chain + " genesis file");
    oThis._modifyGenesisFile(chain, chainGenesisLocation);

    // Alloc balance in genesis files
    logger.info("* Init " + chain + " chain");
    oThis._initChain(chain, chainDataDir, chainGenesisLocation);
  },

  /**
   * Move keystore files from temp geth to required geth instances
   *
   * @return {object}
   */
  copyPreInitAddressesToChains: function() {
    const oThis = this;

    // copy all keystore files from temp location to required location
    for (var i=0; i < preInitAddressName.length; i++) {
      var name = preInitAddressName[i]
        , nameDetails = setupConfig.addresses[name]
        , keystoreFileNameLike = nameDetails.address.value.replace(hexStartsWith, '*')
      ;
      for (var chain in nameDetails.chains) {
        var chainFolder = oThis.getChainDataFolder(chain)
          , fromFolder = tempGethFolder + '/' + keystoreFolder
          , toFolder = chainFolder + '/' + keystoreFolder
        ;
        logger.info("* Copying " + name + " keystore file to " + chain + " chain");
        fileManager.cp(fromFolder, toFolder, keystoreFileNameLike);
      }
    }
  },

  /**
   * Copy all addresses and import respective keystore files to required geth instances
   *
   * @param addresses
   */
  importPostInitAddressesToChains: function(addresses) {
    const oThis = this;

    for (var name in setupConfig.addresses) {
      var nameDetails = setupConfig.addresses[name]
        , privateKey = addresses[nameDetails.address.value]
      ;
      if(preInitAddressName.includes(name)){
        continue;
      }

      var chainsToImport = Object.keys(nameDetails.chains);
      for(var i=0;i<chainsToImport.length;i++){
        var chain = chainsToImport[i];
        logger.info("* Copying " + name + " keystore file to " + chain + " chain");
        oThis._importKeyFilesToGeth(setupConfig.chains[chain].folder_name, nameDetails, privateKey);
      }
    }
  },

  /**
   * Check if chains started mining and are ready
   *
   * @param {string} chain - name of the chain
   *
   * @return {promise}
   */
  isChainReady: function (chain) {
    const retryAttempts = 10
      , timerInterval = 5000
      , chainTimer = {timer: undefined, blockNumber: 0, retryCounter: 0}
      , provider = (chain == 'utility' ? web3RpcUtilityProvider : web3RpcValueProvider);
    ;
    return new Promise(function (onResolve, onReject) {
      chainTimer['timer'] = setInterval(function () {
        if (chainTimer['retryCounter'] <= retryAttempts) {
          provider.eth.getBlockNumber(function (err, blocknumber) {
            if (err) {
            } else {
              if (chainTimer['blockNumber']!=0 && chainTimer['blockNumber']!=blocknumber) {
                logger.info("* Geth Checker - " + chain + " chain has new blocks.");
                clearInterval(chainTimer['timer']);
                onResolve();
              }
              chainTimer['blockNumber'] = blocknumber;
            }
          });
        } else {
          logger.error("Geth Checker - " + chain + " chain has no new blocks.");
          onReject();
          process.exit(1);
        }
        chainTimer['retryCounter']++;
      }, timerInterval);
    });
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
  _generatePreInitAddresses: function(relativeDataDir, passphrase) {
    const tmpPasswordFilePath = relativeDataDir + '/' + tempPasswordFile
      , absoluteDirPath = setupHelper.setupFolderAbsolutePath() + '/' + relativeDataDir;

    // creating password file in a temp location
    fileManager.touch(tmpPasswordFilePath, passphrase);

    // generate keystore file and address
    const cmd = 'geth --datadir "' + absoluteDirPath + '" account new --password ' +
      setupHelper.setupFolderAbsolutePath() + '/' + tmpPasswordFilePath;
    var addressGerationResponse = fileManager.exec(cmd);

    // remove password
    fileManager.rm(tmpPasswordFilePath);

    // parsing the response to get address
    return addressGerationResponse.stdout.replace("Address: {", hexStartsWith).replace("}", "").trim();
  },

  /**
   * Create required Addresses for set up.
   *
   * @param options {Object} Optional parameter for passing pre generated addresses with their private key.
   * @return {object}
   * @private
   */
  _createAddresses: function(options){
    var pre_generated_addresses = (options || {}).pre_generated_addresses
      , rawAddresses = {}
      ;

    for (var name in setupConfig.addresses){
      var nameDetails = setupConfig.addresses[name]
        , privateKey = ''
      ;
      if(preInitAddressName.includes(name)){
        continue;
      }

      // Check if pre generated address details are provided and can be overwritten
      if (Array.isArray(pre_generated_addresses) && pre_generated_addresses.length > 0) {
        var pre_generated_address = pre_generated_addresses.pop();
        // retrieve details from private key
        try{
          if (pre_generated_address.privateKey) {
            var privateKeyObj = (new Web3).eth.accounts.privateKeyToAccount(pre_generated_address.privateKey);
            if(basicHelper.isAddressValid(pre_generated_address.address) && pre_generated_address.address === privateKeyObj.address){
              nameDetails.address.value = privateKeyObj.address;
              privateKey = privateKeyObj.privateKey;
              // override passphrase if provided from outside
              if (pre_generated_address.passphrase) {
                nameDetails.passphrase.value = pre_generated_address.passphrase;
              }
            }
          }
        } catch (err) {
          nameDetails.address.value = '';
        }
      }
      if(nameDetails.address.value === ''){
        // Generate New address
        const response = new generateRawKeyKlass().perform();
        if (response.isFailure()) {
          logger.error(response);
          process.exit(1);
        }
        nameDetails.address.value = response.data.address;
        privateKey = response.data.privateKey;
      }
      rawAddresses[nameDetails.address.value] = privateKey;
      logger.info("* " + name + " address: {" + nameDetails.address.value + "}");
    }

    return rawAddresses;
  },

  /**
   * Import keystore file to respective chain directory.
   *
   * @param chainDirectory
   * @param nameDetails
   * @param privateKey
   * @private
   */
  _importKeyFilesToGeth: function(chainDirectory, nameDetails, privateKey){
    var relativeDataDir = chainDirectory
      , tmpPasswordFilePath = relativeDataDir + '/' + tempPasswordFile
      , tmpPassphraseFilePath = relativeDataDir + '/' + tempPrivateKeyFile
      , absoluteDirPath = setupHelper.setupFolderAbsolutePath() + '/' + relativeDataDir;

    // creating password and passphrase file in a temp location
    fileManager.touch(tmpPasswordFilePath, nameDetails.passphrase.value);
    fileManager.touch(tmpPassphraseFilePath, privateKey.replace(hexStartsWith, ''));

    // generate keystore file and address
    var cmd = 'geth --datadir "' + absoluteDirPath + '" account import --password ' +
      setupHelper.setupFolderAbsolutePath() + '/' + tmpPasswordFilePath + ' ' +
      setupHelper.setupFolderAbsolutePath() + '/' + tmpPassphraseFilePath;
    var addressGerationResponse = fileManager.exec(cmd);

    // remove password and passphrase file
    fileManager.rm(tmpPasswordFilePath);
    fileManager.rm(tmpPassphraseFilePath);
  }
};

module.exports = new GethManagerKlass();
