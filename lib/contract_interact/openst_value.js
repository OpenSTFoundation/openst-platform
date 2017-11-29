"use strict";

const rootPrefix = '../..'
  , web3RpcProvider = require('../web3/providers/value_rpc')
  , helper = require('./helper')
  , contractName = 'openSTValue'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContractAddr = coreAddresses.getAddressForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract(contractAbi)
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , registrarAddress = coreAddresses.getAddressForUser('valueRegistrar')
  , registrarKey = coreAddresses.getPassphraseForUser('valueRegistrar')
  , OpsMangedContract = require("./ops_managed_contract")
  , VC_GAS_PRICE = coreConstants.OST_VALUE_GAS_PRICE
;

//currContract.setProvider( web3RpcProvider.currentProvider );

const OpenSTValue = module.exports = function (contractAddress) {
  this.contractAddress = contractAddress;

  OpsMangedContract.call(this, contractAddress, web3RpcProvider, currContract, VC_GAS_PRICE);

  currContract.options.address = contractAddress;
  currContract.setProvider(web3RpcProvider.currentProvider);

};

OpenSTValue.prototype = Object.create(OpsMangedContract.prototype);

OpenSTValue.prototype.constructor = OpenSTValue;

OpenSTValue.prototype.stake = async function (reserveAddress, reservePassphrase, uuid, amountST, beneficiaryAddr) {

  const encodedABI = currContract.methods.stake(uuid, amountST, beneficiaryAddr).encodeABI();

    const transactionReceiptResult = await helper.safeSendFromAddr(
      web3RpcProvider,
      currContractAddr,
      encodedABI,
      reserveAddress,
      reservePassphrase,
      { gasPrice: VC_GAS_PRICE , gas: 1000000} // TODO - move gas to a constant for methods which take more than usual gas.
    );

  //return => amountUT, nonce, unlockHeight, stakingIntentHash
  return Promise.resolve(transactionReceiptResult);

};

OpenSTValue.prototype.processStaking = async function (reserveAddress, reservePassphrase, stakingIntentHash) {

  const encodedABI = currContract.methods.processStaking(stakingIntentHash).encodeABI();

  const transactionReceiptResult = await helper.safeSendFromAddr(
    web3RpcProvider,
    currContractAddr,
    encodedABI,
    reserveAddress,
    reservePassphrase,
    {gasPrice: VC_GAS_PRICE}
  );

  console.log('process staking -------------------------------------------------------');
  console.log(transactionReceiptResult);
  console.log('-------------------------------------------------------');

  //return => tokenAddress;
  return Promise.resolve(transactionReceiptResult);

};

OpenSTValue.prototype.registerUtilityToken = async function (symbol, name, conversionRate, chainId, reserveAddr,
                                                             checkUuid, senderName) {
  console.log("Sender ===> " + senderName);
  const encodedABI = currContract.methods.registerUtilityToken(symbol, name, conversionRate, chainId, reserveAddr, checkUuid).encodeABI();
  const transactionReceipt = await helper.safeSend(
    web3RpcProvider,
    currContractAddr,
    encodedABI,
    senderName,
    {gasPrice: VC_GAS_PRICE}
  );

  console.log('----------------------------------------------------------------------');
  console.log(JSON.stringify(transactionReceipt));
  console.log('----------------------------------------------------------------------');

  return Promise.resolve(transactionReceipt);
};

OpenSTValue.prototype.getRegistrar = function () {
  return currContract.methods.registrar().call()
    .then(_out => {
      console.log("getRegistrar :: _out", _out);
      Promise.resolve(_out);
    })
    ;
};

OpenSTValue.prototype.getHashUUID = function (sym, name, chainIdValue, chainIdUtility, contractAddress, convertionRate) {
  return currContract.methods.hashUuid(sym, name, chainIdValue, chainIdUtility, contractAddress, convertionRate).call()
    .then(_out => {
      console.log("getRegistrar :: _out", _out);
      Promise.resolve(_out);
    })
    ;
};

