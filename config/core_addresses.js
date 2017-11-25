"use strict";

/**
 * List of all addresses and there respective abi, bin, passphrase
 * required for platform.
 *
 * And helper methods to access this information using human readable
 * names.
 *
 */

const relPath = ".."
  , coreAbis = require('./core_abis')
  , coreBins = require('./core_bins')
  , coreConstants = require('./core_constants')
  , utilityRegistrarConfig = require(relPath+"/utility_registrar_config.json");

const allAddresses = {
  users: {

    foundation: {
      address: process.env.OST_FOUNDATION_ADDR,
      passphrase: ''
    },

    utilityChainOwner: {
      address: process.env.OST_UTILITY_CHAIN_OWNER_ADDR,
      passphrase: ''
    },

    // This is value chain registrar address
    registrar: {
      address: process.env.OST_REGISTRAR_ADDR,
      passphrase: process.env.OST_REGISTRAR_PASSPHRASE
    },

    deployer: {
      address: process.env.OST_DEPLOYER_ADDR,
      passphrase: process.env.OST_DEPLOYER_PASSPHRASE
    }

  },

  contracts: {
    simpleToken: {
      address: process.env.OST_SIMPLE_TOKEN_CONTRACT_ADDR,
      abi: coreAbis.simpleToken,
      bin: coreBins.simpleToken
    },

    openSTUtility: {
      address: process.env.OST_OPENSTUTILITY_CONTRACT_ADDR,
      abi: coreAbis.openSTUtility,
      bin: coreBins.openSTUtility
    },

    openSTValue: {
      address: process.env.OST_OPENSTVALUE_CONTRACT_ADDR,
      abi: coreAbis.openSTValue,
      bin: coreBins.openSTValue
    },

    stPrime: {
      address: process.env.OST_STPRIME_CONTRACT_ADDR,
      abi: coreAbis.stPrime,
      bin: coreBins.stPrime
    },

    valueCore: {
      address: process.env.OST_VALUE_CORE_CONTRACT_ADDR,
      abi: coreAbis.valueCore,
      bin: coreBins.valueCore
    },

    valueRegistrar: {
      address: process.env.OST_VALUE_REGISTRAR_CONTRACT_ADDR,
      abi: coreAbis.valueRegistrar,
      bin: coreBins.valueRegistrar
    },

    utilityRegistrar: {
      address: process.env.OST_UTILITY_REGISTRAR_CONTRACT_ADDR,
      abi: coreAbis.utilityRegistrar,
      bin: coreBins.utilityRegistrar
    },

    staking: {
      address: process.env.OST_STAKING_CONTRACT_ADDR,
      abi: coreAbis.staking,
      bin: coreBins.staking
    },

    brandedToken: {
      address: process.env.OST_UTILITY_TOKEN_CONTRACT_ADDR,
      abi: coreAbis.brandedToken,
      bin: coreBins.brandedToken
    }
  }
};

// generate a contract address to name map for reverse lookup
const addrToContractNameMap = {};
for (var contractName in allAddresses.contracts) {
  var addr = allAddresses.contracts[contractName].address;

  if ( Array.isArray(addr) ) {
    for (var i = 0; i < addr.length; i++) {
      addrToContractNameMap[addr[i].toLowerCase()] = contractName;
    }
  } else {
    addrToContractNameMap[addr.toLowerCase()] = contractName;
  }
}

// helper methods to access difference addresses and their respective details
const coreAddresses = {
  getAddressForUser: function(userName) {
    return allAddresses.users[userName].address;
  },

  getPassphraseForUser: function(userName) {
    return allAddresses.users[userName].passphrase;
  },

  getAddressForContract: function(contractName) {
    var contractAddress = allAddresses.contracts[contractName].address;
    if (!contractAddress || contractAddress==='' || Array.isArray(contractAddress)) {
      throw "Please pass valid contractName to get contract address";
    }
    return contractAddress;
  },

  // This must return array of addresses.
  getAddressesForContract: function(contractName) {
    var contractAddresses = allAddresses.contracts[contractName].address;
    if (!contractAddresses || !Array.isArray(contractAddresses) || contractAddresses.length===0) {
      throw "Please pass valid contractName to get contract address";
    }
    return contractAddresses;
  },

  getContractNameFor: function(contractAddr) {
    return addrToContractNameMap[(contractAddr || '').toLowerCase()];
  },

  getAbiForContract: function(contractName) {
    return allAddresses.contracts[contractName].abi;
  },

  getBinForContract: function(contractName) {
    return allAddresses.contracts[contractName].bin;
  },

  getUtilityRegistrarAddress: function(utilityChainId) {
    var utilityChainObj = utilityRegistrarConfig[utilityChainId];
    if (utilityChainObj) {
      return utilityChainObj.registrarAddr;
    }
    return "";
  },

  getUtilityRegistrarPassphrase: function(utilityChainId) {
    var utilityChainObj = utilityRegistrarConfig[utilityChainId];
    if (utilityChainObj) {
      return utilityChainObj.registrarPassphrase;
    }
    return "";
  }
};

module.exports = coreAddresses;

