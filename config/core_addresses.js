"use strict";

const relPath = ".."
  , core_abis = require('./core_abis')
  , core_bins = require('./core_bins')
  , coreConstants = require('./core_constants')
  , utilityRegistrarConfig = require(relPath+"/utility_registrar_config.json");

const allAddresses = {
  users: {

    foundation: {
      address: process.env.OST_FOUNDATION_ADDR,
      passphrase: process.env.OST_FOUNDATION_PASSPHRASE
    },

    simpleTokenCompany: {
      address: process.env.OST_SIMPLETOKENCOMPANY_ADDR,
      passphrase: coreConstants.OST_SIMPLETOKENCOMPANY_PASSPHRASE
    },

    // This is value chain registrar
    registrar: {
      address: process.env.OST_REGISTRAR_ADDR,
      passphrase: process.env.OST_REGISTRAR_PASSPHRASE
    },

    deployer: {
      address: process.env.OST_DEPLOYER_ADDR,
      passphrase: process.env.OST_DEPLOYER_PASSPHRASE
    },
    
  },

  contracts: {
    simpleToken: {
      address: process.env.OST_SIMPLE_TOKEN_CONTRACT_ADDR,
      abi: core_abis.simpleToken,
      bin: core_bins.simpleToken
    },

    openSTUtility: {
      address: process.env.OST_OPENSTUTILITY_CONTRACT_ADDR,
      abi: core_abis.openSTUtility,
      bin: core_bins.openSTUtility
    },

    openSTValue: {
      address: process.env.OST_OPENSTVALUE_CONTRACT_ADDR,
      abi: core_abis.openSTValue,
      bin: core_bins.openSTValue
    },

    stPrime: {
      address: process.env.OST_STPRIME_CONTRACT_ADDR,
      abi: core_abis.stPrime,
      bin: core_bins.stPrime
    },

    valueCore: {
      address: process.env.OST_VALUE_CORE_CONTRACT_ADDR,
      abi: core_abis.valueCore,
      bin: core_bins.valueCore
    },

    valueRegistrar: {
      address: process.env.OST_VALUE_REGISTRAR_CONTRACT_ADDR,
      abi: core_abis.valueRegistrar,
      bin: core_bins.valueRegistrar
    },

    utilityRegistrar: {
      address: process.env.OST_UTILITY_REGISTRAR_CONTRACT_ADDR,
      abi: core_abis.utilityRegistrar,
      bin: core_bins.utilityRegistrar
    },

    staking: {
      address: process.env.OST_STAKING_CONTRACT_ADDR,
      abi: core_abis.staking,
      bin: core_bins.staking
    },

    utilityToken: {
      address: process.env.OST_UTILITY_TOKEN_CONTRACT_ADDR,
      abi: core_abis.utilityToken,
      bin: core_bins.utilityToken
    }
  }
};

const addrToContractNameMap = {};

for(var contractName in allAddresses.contracts) {
  var addr = allAddresses.contracts[contractName].address;

  if ( Array.isArray(addr) ) {
    for(var i = 0; i < addr.length; i ++) {
      addrToContractNameMap[addr[i].toLowerCase()] = contractName;
    }
  } else {
    addrToContractNameMap[addr.toLowerCase()] = contractName;
  }
}

const coreAddresses = {
  getAddressForUser: function(userName){
    return allAddresses.users[userName].address;
  },

  getPassphraseForUser: function(userName){
    return allAddresses.users[userName].passphrase;
  },

  getAddressForContract: function(contractName){
    var contractAddress = allAddresses.contracts[contractName].address;
    if(!contractAddress || contractAddress=='' || Array.isArray(contractAddress)){
      throw "Please pass valid contractName to get contract address"
    }
    return contractAddress;
  },

  // This must return array of addresses.
  getAddressesForContract: function(contractName){
    var contractAddresses = allAddresses.contracts[contractName].address;
    if(!contractAddresses || !Array.isArray(contractAddresses) || contractAddresses.length==0 ){
      throw "Please pass valid contractName to get contract address"
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
    return ""
  },

  getUtilityRegistrarPassphrase: function(utilityChainId) {
    var utilityChainObj = utilityRegistrarConfig[utilityChainId];
    if (utilityChainObj) {
      return utilityChainObj.registrarPassphrase;
    }
    return ""
  }
};

module.exports = coreAddresses;

