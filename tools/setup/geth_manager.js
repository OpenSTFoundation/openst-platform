'use strict';
/**
 * Geth process setup
 *
 * @module tools/setup/geth_manager
 */

const shell = require('shelljs'),
  editJsonFile = require('edit-json-file'),
  Path = require('path'),
  BigNumber = require('bignumber.js');

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  setupConfig = require(rootPrefix + '/tools/setup/config'),
  setupHelper = require(rootPrefix + '/tools/setup/helper'),
  fileManager = require(rootPrefix + '/tools/setup/file_manager'),
  Web3 = require('web3'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  basicHelper = require(rootPrefix + '/helpers/basic_helper');

require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/services/utils/generate_raw_key');

const tempGethFolder = 'tmp-geth',
  keystoreFolder = 'keystore',
  tempPasswordFile = 'tmp_password_file',
  tempPrivateKeyFile = 'tmp_private_key_file',
  hexStartsWith = '0x',
  genesisTemplateLocation = Path.join(__dirname),
  etherToWeiConversion = new BigNumber(1000000000000000000),
  preInitAddressName = ['sealer', 'valueAdmin'];

/**
 * Constructor for geth manager
 *
 * @constructor
 */
const GethManagerKlass = function(configStrategy, instanceComposer) {};

GethManagerKlass.prototype = {
  /**
   * Create Temp GETH folder
   */
  createTempGethFolder: function() {
    // create temp geth folder
    fileManager.mkdir(tempGethFolder);
  },

  /**
   * Generate all required addresses.
   *
   * @param options
   * @return {Object} Addresses generated
   */
  generateAddresses: function(options) {
    const oThis = this;

    return oThis._createAddresses(options);
  },

  /**
   * Generate all required pre init addresses in temp geth data dir
   */
  generatePreInitAddresses: function() {
    const oThis = this;

    // create all required addresses in tmp geth data dir
    for (let i = 0; i < preInitAddressName.length; i++) {
      let name = preInitAddressName[i],
        nameDetails = setupConfig.addresses[name],
        address = oThis._generatePreInitAddresses(tempGethFolder, nameDetails.passphrase.value);

      logger.info('* ' + name + ' address:', address);
      nameDetails.address.value = address;
    }
  },

  /**
   * Initialize chain
   *
   * @param {string} chain - name of the chain
   */
  initChain: function(chain) {
    const oThis = this,
      chainFolder = setupHelper.gethFolderFor(chain),
      chainDataDir = setupHelper.setupFolderAbsolutePath() + '/' + setupHelper.gethFolderFor(chain),
      chainGenesisTemplateLocation = genesisTemplateLocation + '/genesis-' + chain + '.json',
      chainGenesisLocation = chainDataDir + '/genesis-' + chain + '.json';

    // create chain folder
    logger.info('* Creating ' + chain + ' folder');
    fileManager.mkdir(chainFolder);
    // copy genesis template file in chain folder
    logger.info('* Copying ' + chain + ' genesis template file');
    fileManager.exec('cp ' + chainGenesisTemplateLocation + ' ' + chainGenesisLocation);

    // Alloc balance in genesis files
    logger.info('* Modifying ' + chain + ' genesis file');
    oThis._modifyGenesisFile(chain, chainGenesisLocation);

    // Alloc balance in genesis files
    logger.info('* Init ' + chain + ' chain');
    oThis._initChain(chain, chainDataDir, chainGenesisLocation);
  },

  /**
   * Move keystore files from temp geth to required geth instances
   *
   * @param {string} chain - name of the chain to which the addresses are to be copied
   *
   * @return {object}
   */
  copyPreInitAddressesToChain: function(chain) {
    const oThis = this;

    // copy all keystore files from temp location to required location
    for (let i = 0; i < preInitAddressName.length; i++) {
      let name = preInitAddressName[i],
        nameDetails = setupConfig.addresses[name],
        addressSetupConfigObj = setupConfig.addresses[name].address,
        addressValue =
          addressSetupConfigObj.value === ''
            ? fileManager.getPlatformConfig()[addressSetupConfigObj.env_var]
            : addressSetupConfigObj.value,
        keystoreFileNameLike = addressValue.replace(hexStartsWith, '*');

      // if the address is not valid for the chain, continue with the next address
      if (!nameDetails.chains[chain]) continue;

      let chainFolder = setupHelper.gethFolderFor(chain),
        fromFolder = tempGethFolder + '/' + keystoreFolder,
        toFolder = chainFolder + '/' + keystoreFolder;
      logger.info('* Copying ' + name + ' keystore file to ' + chain + ' chain');
      fileManager.cp(fromFolder, toFolder, keystoreFileNameLike);
    }
  },

  /**
   * Copy all addresses and import respective keystore files to required geth instances
   *
   * @param {object} allocatedAddresses - address name to address details map
   * @param {string} chain - name of the chain to which the addresses are to be copied
   *
   */
  importPostInitAddressesToChain: function(allocatedAddresses, chain) {
    const oThis = this;

    for (let name in setupConfig.addresses) {
      if (preInitAddressName.includes(name)) {
        continue;
      }

      let nameDetails = setupConfig.addresses[name],
        privateKey = allocatedAddresses[name].private_key;

      let chainsToImport = Object.keys(nameDetails.chains);

      if (chainsToImport.indexOf(chain) === -1) continue;

      logger.info('* Copying ' + name + ' keystore file to ' + chain + ' chain');
      oThis._importKeyFilesToGeth(setupHelper.gethFolderFor(chain), privateKey, nameDetails.passphrase.value);
    }
  },

  /**
   * Check if chains started mining and are ready
   *
   * @param {string} chain - name of the chain
   *
   * @return {promise}
   */
  isChainReady: function(chain) {
    const oThis = this,
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      retryAttempts = 10,
      timerInterval = 5000,
      chainTimer = { timer: undefined, blockNumber: 0, retryCounter: 0 };

    if (chain != 'utility') {
      chain = 'value';
    }

    const provider = web3ProviderFactory.getProvider(chain, 'ws');

    return new Promise(function(onResolve, onReject) {
      chainTimer['timer'] = setInterval(function() {
        if (chainTimer['retryCounter'] <= retryAttempts) {
          provider.eth.getBlockNumber(function(err, blocknumber) {
            if (err) {
            } else {
              if (chainTimer['blockNumber'] != 0 && chainTimer['blockNumber'] != blocknumber) {
                logger.info('* Geth Checker - ' + chain + ' chain has new blocks.');
                clearInterval(chainTimer['timer']);
                onResolve();
              }
              chainTimer['blockNumber'] = blocknumber;
            }
          });
        } else {
          logger.error('Geth Checker - ' + chain + ' chain has no new blocks.');
          onReject();
          process.exit(1);
        }
        chainTimer['retryCounter']++;
      }, timerInterval);
    });
  },

  /**
   * Get address by name
   *
   * @param {string} name - account name
   */
  getGeneratedAddressByName: function(name) {
    const addressSetupConfigObj = setupConfig.addresses[name].address;
    return addressSetupConfigObj.value === ''
      ? fileManager.getPlatformConfig()[addressSetupConfigObj.env_var]
      : addressSetupConfigObj.value;
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
    const oThis = this,
      coreConstants = oThis.ic().getCoreConstants(),
      gasLimitOn = { utility: coreConstants.OST_UTILITY_GAS_LIMIT, value: coreConstants.OST_VALUE_GAS_LIMIT },
      allocBalancesOn = {
        utility: new BigNumber(coreConstants.OST_UTILITY_STPRIME_TOTAL_SUPPLY).mul(etherToWeiConversion),
        value: new BigNumber('1000000').mul(etherToWeiConversion)
      };
    const chainId = setupConfig.chains[chain].chain_id.value,
      allocBalanceToAddrName = setupConfig.chains[chain].alloc_balance_to_addr,
      allocAmount = hexStartsWith + allocBalancesOn[chain].toString(16),
      gasLimit = hexStartsWith + gasLimitOn[chain].toString(16);

    const allocAmountToAddress = oThis.getGeneratedAddressByName(allocBalanceToAddrName);
    const sealerAddress = oThis.getGeneratedAddressByName('sealer');

    const extraData =
      '0x0000000000000000000000000000000000000000000000000000000000000000' +
      sealerAddress.replace(hexStartsWith, '') +
      '0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

    // If the file doesn't exist, the content will be an empty object by default.
    const file = editJsonFile(chainGenesisLocation);

    // Alloc balance to required address
    file.set('alloc.' + allocAmountToAddress + '.balance', allocAmount);

    // set chain id
    file.set('config.chainId', chainId);

    // set gas limit
    file.set('gasLimit', gasLimit);

    // add extra data
    if (chain == 'utility') {
      file.set('extraData', extraData);
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
    const tmpPasswordFilePath = relativeDataDir + '/' + tempPasswordFile,
      absoluteDirPath = setupHelper.setupFolderAbsolutePath() + '/' + relativeDataDir;

    // creating password file in a temp location
    fileManager.touch(tmpPasswordFilePath, passphrase);

    // generate keystore file and address
    const cmd =
      'geth --datadir "' +
      absoluteDirPath +
      '" account new --password ' +
      setupHelper.setupFolderAbsolutePath() +
      '/' +
      tmpPasswordFilePath;
    let addressGenerationResponse = fileManager.exec(cmd);

    // remove password
    fileManager.rm(tmpPasswordFilePath);

    // parsing the response to get address
    return addressGenerationResponse.stdout
      .replace('Address: {', hexStartsWith)
      .replace('}', '')
      .trim();
  },

  /**
   * Create required Addresses for set up.
   *
   * @param options {Object} Optional parameter for passing pre generated addresses with their private key.
   * @return {object}
   * @private
   */
  _createAddresses: function(options) {
    const oThis = this,
      generateRawKeyKlass = oThis.ic().getGenerateRawKeyService();

    let pre_generated_addresses = (options || {}).pre_generated_addresses,
      rawAddresses = {};

    for (let name in setupConfig.addresses) {
      let nameDetails = setupConfig.addresses[name],
        privateKey = '';

      if (preInitAddressName.includes(name)) {
        continue;
      }

      // Check if pre generated address details are provided and can be overwritten
      if (Array.isArray(pre_generated_addresses) && pre_generated_addresses.length > 0) {
        let pre_generated_address = pre_generated_addresses.pop();

        // retrieve details from private key
        try {
          if (pre_generated_address.privateKey) {
            let privateKeyObj = new Web3().eth.accounts.privateKeyToAccount(pre_generated_address.privateKey);
            if (
              basicHelper.isAddressValid(pre_generated_address.address) &&
              pre_generated_address.address === privateKeyObj.address
            ) {
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

      if (nameDetails.address.value === '') {
        // Generate New address
        const response = new generateRawKeyKlass().perform();

        if (response.isFailure()) {
          logger.error(response);
          process.exit(1);
        }

        nameDetails.address.value = response.data.address;

        privateKey = response.data.privateKey;
      }

      rawAddresses[name] = {
        address: nameDetails.address.value,
        private_key: privateKey
      };

      logger.info('* ' + name + ' address: {' + nameDetails.address.value + '}');
    }
    return rawAddresses;
  },

  /**
   * Import keystore file to respective chain directory.
   *
   * @param chainDirectory
   * @param privateKey
   * @param passphrase
   *
   * @private
   */
  _importKeyFilesToGeth: function(chainDirectory, privateKey, passphrase) {
    let relativeDataDir = chainDirectory,
      tmpPasswordFilePath = relativeDataDir + '/' + tempPasswordFile,
      tmpPassphraseFilePath = relativeDataDir + '/' + tempPrivateKeyFile,
      absoluteDirPath = setupHelper.setupFolderAbsolutePath() + '/' + relativeDataDir;

    // creating password and passphrase file in a temp location
    fileManager.touch(tmpPasswordFilePath, passphrase);
    fileManager.touch(tmpPassphraseFilePath, privateKey.replace(hexStartsWith, ''));

    // generate keystore file and address
    let cmd =
      'geth --datadir "' +
      absoluteDirPath +
      '" account import --password ' +
      setupHelper.setupFolderAbsolutePath() +
      '/' +
      tmpPasswordFilePath +
      ' ' +
      setupHelper.setupFolderAbsolutePath() +
      '/' +
      tmpPassphraseFilePath;
    let addressGenerationResponse = fileManager.exec(cmd);

    // remove password and passphrase file
    fileManager.rm(tmpPasswordFilePath);
    fileManager.rm(tmpPassphraseFilePath);
  }
};

InstanceComposer.register(GethManagerKlass, 'getSetupGethManager', true);

module.exports = GethManagerKlass;
