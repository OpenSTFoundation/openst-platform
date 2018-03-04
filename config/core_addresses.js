"use strict";

/**
 * List of all known addresses and there respective abi, bin, passphrase
 * and other properties required for platform. And implementation
 * of helper methods to access this information using human readable names.
 *
 * @module config/core_addresses
 */

const rootPrefix = ".."
  , coreAbis = require(rootPrefix + '/config/core_abis')
  , coreBins = require(rootPrefix + '/config/core_bins');

// Flag to do a mock deployment testing on MainNet
// OpenST mockSimpleToken contract is used for deployment
// and services
var simpleTokenAbi, simpleTokenBin, simpleTokenAddr;
if (process.env.USE_MOCK_SIMPLE_TOKEN != 1) {
  simpleTokenAddr = process.env.OST_SIMPLE_TOKEN_CONTRACT_ADDR;
  simpleTokenAbi = coreAbis.simpleToken;
  simpleTokenBin = coreBins.simpleToken;
} else {
  simpleTokenAddr = process.env.OST_SIMPLE_TOKEN_CONTRACT_ADDR;
  simpleTokenAbi = coreAbis.mockSimpleToken;
  simpleTokenBin = coreBins.mockSimpleToken;
}

const allAddresses = {
  users: {

    /**
     * foundation account details
     * @constant {object}
     */
    foundation: {
      address: process.env.OST_FOUNDATION_ADDR,
      passphrase: process.env.OST_FOUNDATION_PASSPHRASE
    },

    /**
     * utility chain owner account details
     * @constant {object}
     */
    utilityChainOwner: {
      address: process.env.OST_UTILITY_CHAIN_OWNER_ADDR,
      passphrase: process.env.OST_UTILITY_CHAIN_OWNER_PASSPHRASE
    },

    /**
     * staker account details
     * @constant {object}
     */
    staker: {
      address: process.env.OST_STAKER_ADDR,
      passphrase: process.env.OST_STAKER_PASSPHRASE
    },

    /**
     * redeemer account details
     * @constant {object}
     */
    redeemer: {
      address: process.env.OST_REDEEMER_ADDR,
      passphrase: process.env.OST_REDEEMER_PASSPHRASE
    },

    /**
     * value registrar account details
     * @constant {object}
     */
    valueRegistrar: {
      address: process.env.OST_VALUE_REGISTRAR_ADDR,
      passphrase: process.env.OST_VALUE_REGISTRAR_PASSPHRASE
    },

    /**
     * utility registrar account details
     * @constant {object}
     */
    utilityRegistrar: {
      address: process.env.OST_UTILITY_REGISTRAR_ADDR,
      passphrase: process.env.OST_UTILITY_REGISTRAR_PASSPHRASE
    },

    /**
     * value deployer account details
     * @constant {object}
     */
    valueDeployer: {
      address: process.env.OST_VALUE_DEPLOYER_ADDR,
      passphrase: process.env.OST_VALUE_DEPLOYER_PASSPHRASE
    },

    /**
     * utility deployer account details
     * @constant {object}
     */
    utilityDeployer: {
      address: process.env.OST_UTILITY_DEPLOYER_ADDR,
      passphrase: process.env.OST_UTILITY_DEPLOYER_PASSPHRASE
    },

    /**
     * value ops account details
     * @constant {object}
     */
    valueOps: {
      address: process.env.OST_VALUE_OPS_ADDR,
      passphrase: process.env.OST_VALUE_OPS_PASSPHRASE
    },

    /**
     * utility ops account details
     * @constant {object}
     */
    utilityOps: {
      address: process.env.OST_UTILITY_OPS_ADDR,
      passphrase: process.env.OST_UTILITY_OPS_PASSPHRASE
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
      address: process.env.OST_OPENSTUTILITY_CONTRACT_ADDR,
      abi: coreAbis.openSTUtility,
      bin: coreBins.openSTUtility
    },

    /**
     * openst value contract details
     * @constant {object}
     */
    openSTValue: {
      address: process.env.OST_OPENSTVALUE_CONTRACT_ADDR,
      abi: coreAbis.openSTValue,
      bin: coreBins.openSTValue
    },

    /**
     * ST' contract details
     * @constant {object}
     */
    stPrime: {
      address: process.env.OST_STPRIME_CONTRACT_ADDR,
      abi: coreAbis.stPrime,
      bin: coreBins.stPrime
    },

    /**
     * value core contract details
     * @constant {object}
     */
    valueCore: {
      address: process.env.OST_VALUE_CORE_CONTRACT_ADDR,
      abi: coreAbis.valueCore,
      bin: coreBins.valueCore
    },

    /**
     * value registrar contract details
     * @constant {object}
     */
    valueRegistrar: {
      address: process.env.OST_VALUE_REGISTRAR_CONTRACT_ADDR,
      abi: coreAbis.valueRegistrar,
      bin: coreBins.valueRegistrar
    },

    /**
     * utility registrar contract details
     * @constant {object}
     */
    utilityRegistrar: {
      address: process.env.OST_UTILITY_REGISTRAR_CONTRACT_ADDR,
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

// generate a contract address to name map for reverse lookup
const addrToContractNameMap = {};
for (var contractName in allAddresses.contracts) {
  var addr = allAddresses.contracts[contractName].address;

  if (Array.isArray(addr)) {
    for (var i = 0; i < addr.length; i++) {
      addrToContractNameMap[addr[i].toLowerCase()] = contractName;
    }
  } else if (addr !== null && typeof addr !== "undefined") {
    addrToContractNameMap[addr.toLowerCase()] = contractName;
  }
}

/**
 * Constructor to access different account and contract addresses and their respective details
 *
 * @constructor
 */
const coreAddresses = function () {
};

coreAddresses.prototype = {

  /**
   * Get address of specific account name
   *
   * @param {string} userName - User account name
   *
   * @return {string} - account address
   *
   */
  getAddressForUser: function (userName) {
    return allAddresses.users[userName].address;
  },

  /**
   * Get passphrase of specific account name
   *
   * @param {string} userName - User account name
   *
   * @return {string} - account passphrase
   *
   */
  getPassphraseForUser: function (userName) {
    return allAddresses.users[userName].passphrase;
  },

  /**
   * Get address of specific contract
   *
   * @param {string} contractName - Contract name
   *
   * @return {string} - contract address
   *
   */
  getAddressForContract: function (contractName) {
    var contractAddress = allAddresses.contracts[contractName].address;
    if (Array.isArray(contractAddress)) {
      throw "Please pass valid contractName to get contract address for: " + contractName;
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
  getAddressesForContract: function (contractName) {
    var contractAddresses = allAddresses.contracts[contractName].address;
    if (!contractAddresses || !Array.isArray(contractAddresses) || contractAddresses.length === 0) {
      throw "Please pass valid contractName to get contract address for: " + contractName;
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
  getContractNameFor: function (contractAddr) {
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
  getAbiForContract: function (contractName) {
    return (allAddresses.contracts[contractName] || {}).abi || '';
  },

  /**
   * Get contract binary of a specific contract
   *
   * @param {string} contractName - Contract name
   *
   * @return {binary} - contract binary
   *
   */
  getBinForContract: function (contractName) {
    return (allAddresses.contracts[contractName] || {}).bin || '';
  }
};

module.exports = new coreAddresses();

