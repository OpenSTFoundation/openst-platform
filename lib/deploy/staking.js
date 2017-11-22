"use strict";

const rootPrefix = '../..'
  , contractName = 'staking'
  , deployerName = 'foundation'
  , web3Provider = require(rootPrefix+'/lib/web3/providers/value_rpc')
  , deployHelper = require('./helper')
  , coreAddresses = require(rootPrefix+'/config/core_addresses');

const performer = async function() {

  await deployHelper.perform(
    contractName,
    web3Provider,
    coreAddresses.getAbiForContract(contractName),
    coreAddresses.getBinForContract(contractName),
    coreAddresses.getAddressForUser(deployerName),
    coreAddresses.getPassphraseForUser(deployerName)
  );





};