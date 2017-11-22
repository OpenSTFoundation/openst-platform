"use strict";

const core_abis = require('./core_abis')
  , core_bins = require('./core_bins');

const allAddresses = {
  users: {
    foundation: {
      address: process.env.OST_FOUNDATION_ADDRESS,
      passphrase: process.env.OST_FOUNDATION_PASSPHRASE
    },
    registrar: {
      address: process.env.OST_REGISTRAR_ADDRESS,
      passphrase: process.env.OST_REGISTRAR_PASSPHRASE
    }
  },
  contracts: {
    simpleToken: {
      address: process.env.OST_SIMPLE_TOKEN_CONTRACT_ADDR,
      abi: core_abis.simpleToken,
      bin: core_bins.simpleToken
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
  }
};

module.exports = coreAddresses;

