"use strict";

const rootPrefix = "../.."
  , web3RpcProvider = require('../web3/providers/value_rpc')
  , helper = require('./helper')
  , contractName = 'openSTValue'
  , coreConstants = require(rootPrefix+"/config/core_constants')
  , coreAddresses = require(rootPrefix+"/config/core_addresses')
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currentContractAddr = coreAddresses.getAddressForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract( contractAbi )
  , responseHelper = require(rootPrefix+"/lib/formatter/response')
  , registrarAddress = coreAddresses.getAddressForUser('registrar')
  , registrarKey = coreAddresses.getPassphraseForUser('registrar')
  ;

currContract.setProvider( web3RpcProvider.currentProvider );

const OpenSTValue = module.exports = function () {
}

OpenSTValue.prototype = {

};

