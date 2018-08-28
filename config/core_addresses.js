'use strict';

/**
 * List of all known addresses and there respective abi, bin, passphrase
 * and other properties required for platform. And implementation
 * of helper methods to access this information using human readable names.
 *
 * @module config/core_addresses
 */

const rootPrefix = '..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  coreAbis = require(rootPrefix + '/config/core_abis'),
  coreBins = require(rootPrefix + '/config/core_bins');

/**
 * Constructor to access different account and contract addresses and their respective details
 *
 * @constructor
 */
const CoreAddresses = function(configStrategy, instanceComposer) {
  const oThis = this;
  oThis._buildAllAddresses(configStrategy);
};

CoreAddresses.prototype = {
  _buildAllAddresses: function(configStrategy) {
    // Flag to do a mock deployment testing on MainNet
    // OpenST mockSimpleToken contract is used for deployment
    // and services
    var simpleTokenAbi, simpleTokenBin, simpleTokenAddr;
    if (process.env.USE_MOCK_SIMPLE_TOKEN != 1) {
      simpleTokenAddr = configStrategy.OST_SIMPLE_TOKEN_CONTRACT_ADDR;
      simpleTokenAbi = coreAbis.simpleToken;
      simpleTokenBin = coreBins.simpleToken;
    } else {
      simpleTokenAddr = configStrategy.OST_SIMPLE_TOKEN_CONTRACT_ADDR;
      simpleTokenAbi = coreAbis.mockSimpleToken;
      simpleTokenBin = coreBins.mockSimpleToken;
    }
    const oThis = this;
    oThis.allAddresses = {
      users: {
        /**
         * foundation account details
         * @constant {object}
         */
        foundation: {
          address: configStrategy.OST_FOUNDATION_ADDR,
          passphrase: configStrategy.OST_FOUNDATION_PASSPHRASE
        },

        /**
         * utility chain owner account details
         * @constant {object}
         */
        utilityChainOwner: {
          address: configStrategy.OST_UTILITY_CHAIN_OWNER_ADDR,
          passphrase: configStrategy.OST_UTILITY_CHAIN_OWNER_PASSPHRASE
        },

        /**
         * utility initial ST' Holder account details
         * @constant {object}
         */
        utilityInitialSTPrimeHolder: {
          address: configStrategy.OST_UTILITY_INITIAL_ST_PRIME_HOLDER_ADDR,
          passphrase: configStrategy.OST_UTILITY_INITIAL_ST_PRIME_HOLDER_PASSPHRASE
        },

        /**
         * staker account details
         * @constant {object}
         */
        staker: {
          address: configStrategy.OST_STAKER_ADDR,
          passphrase: configStrategy.OST_STAKER_PASSPHRASE
        },

        /**
         * redeemer account details
         * @constant {object}
         */
        redeemer: {
          address: configStrategy.OST_REDEEMER_ADDR,
          passphrase: configStrategy.OST_REDEEMER_PASSPHRASE
        },

        /**
         * value registrar account details
         * @constant {object}
         */
        valueRegistrar: {
          address: configStrategy.OST_VALUE_REGISTRAR_ADDR,
          passphrase: configStrategy.OST_VALUE_REGISTRAR_PASSPHRASE
        },

        /**
         * utility registrar account details
         * @constant {object}
         */
        utilityRegistrar: {
          address: configStrategy.OST_UTILITY_REGISTRAR_ADDR,
          passphrase: configStrategy.OST_UTILITY_REGISTRAR_PASSPHRASE
        },

        /**
         * value deployer account details
         * @constant {object}
         */
        valueDeployer: {
          address: configStrategy.OST_VALUE_DEPLOYER_ADDR,
          passphrase: configStrategy.OST_VALUE_DEPLOYER_PASSPHRASE
        },

        /**
         * utility deployer account details
         * @constant {object}
         */
        utilityDeployer: {
          address: configStrategy.OST_UTILITY_DEPLOYER_ADDR,
          passphrase: configStrategy.OST_UTILITY_DEPLOYER_PASSPHRASE
        },

        /**
         * value ops account details
         * @constant {object}
         */
        valueOps: {
          address: configStrategy.OST_VALUE_OPS_ADDR,
          passphrase: configStrategy.OST_VALUE_OPS_PASSPHRASE
        },

        /**
         * utility ops account details
         * @constant {object}
         */
        utilityOps: {
          address: configStrategy.OST_UTILITY_OPS_ADDR,
          passphrase: configStrategy.OST_UTILITY_OPS_PASSPHRASE
        },

        /**
         * value admin account details
         * @constant {object}
         */
        valueAdmin: {
          address: configStrategy.OST_VALUE_ADMIN_ADDR,
          passphrase: configStrategy.OST_VALUE_ADMIN_PASSPHRASE
        }

      },

      contracts: {
        /**
         * simple token contract details
         * @constant {object}
         */
        simpleToken: {
          address: simpleTokenAddr,
          abi: simpleTokenAbi,
          bin: simpleTokenBin
        },

        /**
         * openst utility contract details
         * @constant {object}
         */
        openSTUtility: {
          address: configStrategy.OST_OPENSTUTILITY_CONTRACT_ADDR,
          abi: coreAbis.openSTUtility,
          bin: coreBins.openSTUtility
        },

        /**
         * openst value contract details
         * @constant {object}
         */
        openSTValue: {
          address: configStrategy.OST_OPENSTVALUE_CONTRACT_ADDR,
          abi: coreAbis.openSTValue,
          bin: coreBins.openSTValue
        },

        /**
         * ST' contract details
         * @constant {object}
         */
        stPrime: {
          address: configStrategy.OST_STPRIME_CONTRACT_ADDR,
          abi: coreAbis.stPrime,
          bin: coreBins.stPrime
        },

        /**
         * value core contract details
         * @constant {object}
         */
        valueCore: {
          address: configStrategy.OST_VALUE_CORE_CONTRACT_ADDR,
          abi: coreAbis.valueCore,
          bin: coreBins.valueCore
        },

        /**
         * value registrar contract details
         * @constant {object}
         */
        valueRegistrar: {
          address: configStrategy.OST_VALUE_REGISTRAR_CONTRACT_ADDR,
          abi: coreAbis.valueRegistrar,
          bin: coreBins.valueRegistrar
        },

        /**
         * utility registrar contract details
         * @constant {object}
         */
        utilityRegistrar: {
          address: configStrategy.OST_UTILITY_REGISTRAR_CONTRACT_ADDR,
          abi: coreAbis.utilityRegistrar,
          bin: coreBins.utilityRegistrar
        },

        /**
         * branded token contract details
         * @constant {object}
         */
        brandedToken: {
          address: null,
          abi: coreAbis.brandedToken,
          bin: coreBins.brandedToken
        },

        /**
         * simple stake contract details
         * @constant {object}
         */
        simpleStake: {
          address: null,
          abi: coreAbis.simpleStake,
          bin: coreBins.simpleStake
        },

        airdrop: {
          address: null,
          abi: coreAbis.airdrop,
          bin: coreBins.airdrop
        }
      }
    };
  },

  _addrToContractNameMap: null,
  _getAddrToContractNameMap: function() {
    const oThis = this;

    if (oThis._addrToContractNameMap) {
      return oThis._addrToContractNameMap;
    }
    const addrToContractNameMap = (oThis._addrToContractNameMap = {});
    for (var contractName in this.allAddresses.contracts) {
      var addr = this.allAddresses.contracts[contractName].address;

      if (Array.isArray(addr)) {
        for (var i = 0; i < addr.length; i++) {
          addrToContractNameMap[addr[i].toLowerCase()] = contractName;
        }
      } else if (addr !== null && typeof addr !== 'undefined') {
        addrToContractNameMap[addr.toLowerCase()] = contractName;
      }
    }
    return oThis._addrToContractNameMap;
  },

  /**
   * Get address of specific account name
   *
   * @param {string} userName - User account name
   *
   * @return {string} - account address
   *
   */
  getAddressForUser: function(userName) {
    return this.allAddresses.users[userName].address;
  },

  /**
   * Get passphrase of specific account name
   *
   * @param {string} userName - User account name
   *
   * @return {string} - account passphrase
   *
   */
  getPassphraseForUser: function(userName) {
    return this.allAddresses.users[userName].passphrase;
  },

  /**
   * Get address of specific contract
   *
   * @param {string} contractName - Contract name
   *
   * @return {string} - contract address
   *
   */
  getAddressForContract: function(contractName) {
    var contractAddress = this.allAddresses.contracts[contractName].address;
    if (Array.isArray(contractAddress)) {
      throw 'Please pass valid contractName to get contract address for: ' + contractName;
    }
    return contractAddress;
  },

  /**
   * Get list of addresses of a specific contract
   *
   * @param {string} contractName - Contract name
   *
   * @return {array} - contract addresses
   *
   */
  getAddressesForContract: function(contractName) {
    var contractAddresses = this.allAddresses.contracts[contractName].address;
    if (!contractAddresses || !Array.isArray(contractAddresses) || contractAddresses.length === 0) {
      throw 'Please pass valid contractName to get contract address for: ' + contractName;
    }
    return contractAddresses;
  },

  /**
   * Get contract name of a known contract address
   *
   * @param {string} contractAddr - Contract address
   *
   * @return {string} - contract name
   *
   */
  getContractNameFor: function(contractAddr) {
    const oThis = this,
      addrToContractNameMap = oThis._getAddrToContractNameMap();
    return addrToContractNameMap[(contractAddr || '').toLowerCase()];
  },

  /**
   * Get contract ABI of a specific contract
   *
   * @param {string} contractName - Contract name
   *
   * @return {object} - contract ABI
   *
   */
  getAbiForContract: function(contractName) {
    return (this.allAddresses.contracts[contractName] || {}).abi || '';
  },

  /**
   * Get contract binary of a specific contract
   *
   * @param {string} contractName - Contract name
   *
   * @return {binary} - contract binary
   *
   */
  getBinForContract: function(contractName) {
    return (this.allAddresses.contracts[contractName] || {}).bin || '';
  }
};

InstanceComposer.register(CoreAddresses, 'getCoreAddresses', true);

module.exports = CoreAddresses;
