"use strict";

const web3RpcProvider = require('../web3/providers/utility_rpc')
  , helper = require('./helper')
  , contractName = 'utilityToken'
  , coreConstants = require('../../config/core_constants')
  , coreAddresses = require('../../config/core_addresses')
  , currContract = new web3RpcProvider.eth.Contract(coreAddresses.getAbiForContract(contractName))
  , responseHelper = require('../../lib/formatter/response')
  , registrarAddress = coreConstants.OST_REGISTRAR_ADDR
  , registrarKey = coreConstants.OST_REGISTRAR_PASSPHRASE;

const utilityTokenContractInteract = {

  getUuid: function (mcAddress, btAddress) {

    const encodeABI = currContract.methods.uuid().encodeABI();

    return helper.call(web3RpcProvider, btAddress, encodeABI, {from: mcAddress})
      .catch(function (err) {
        console.error(err);
        return Promise.resolve(responseHelper.error('ci_ut_1', 'Something went wrong'));
      })
      .then(function (response) {
        console.log(response);
        return Promise.resolve(responseHelper.successWithData({uuid: response}));
      });

  },

  processMinting: function (memberObject, mintingIntentHash) {

    const encodeABI = currContract.methods.processMinting(mintingIntentHash).encodeABI();
    const mcAddress = memberObject.Reserve;
    const btAddress = memberObject.ERC20;

    return helper.send(web3RpcProvider, btAddress, encodeABI,
                  { from: mcAddress, gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE})
      .catch(function (err) {
        console.error(err);
        return Promise.resolve(responseHelper.error('ci_ut_2', 'Something went wrong'));
      })
      .then(function (response) {
        console.log(response);
        return Promise.resolve(responseHelper.successWithData({}));
      });
  },

  mint: function(btAddress, uuid, minter, minterNonce, amountST, amountUT, escrowUnlockHeight, mintingIntentHash) {

    Assert.strictEqual(typeof uuid, 'string', `uuid must be of type 'string'`);
    Assert.strictEqual(typeof minter, 'string', `minter must be of type 'string'`);
    Assert.strictEqual(typeof mintingIntentHash, 'string', `mintingIntentHash must be of type 'string'`);
    Assert.ok(amountST > 0, "amountST should be greater than 0");
    Assert.ok(amountUT > 0, "amountUT should be greater than 0");

    const encodeABI = currContract.methods.mint(uuid, minter, minterNonce, amountST, amountUT,
      escrowUnlockHeight, mintingIntentHash).encodeABI();

    return web3RpcProvider.eth.personal.unlockAccount( registrarAddress, registrarKey)
        .then(_ => {
          return helper.send(web3RpcProvider, btAddress, encodeABI,
            { from: REGISTRAR_ADDRESS, gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE }
          ).catch(function (err) {
            console.error(err);
            return Promise.resolve(responseHelper.error('ci_ut_3', 'Something went wrong'));
          })
          .then(function (response) {
            console.log(response);
            return Promise.resolve(responseHelper.successWithData({response: response}));
          })
      });
  }

};

module.exports = utilityTokenContractInteract;