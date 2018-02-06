"use strict";

const rootPrefix = '../..'
  , BigNumber = require('bignumber.js')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , simpleTokenContractObj = require(rootPrefix + '/lib/contract_interact/simple_token')
  , etherToWeiCinversion = new BigNumber(1000000000000000000)
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , senderUser = "foundation"
  ;

const GiveTestOstKlass = function(params){
  const oThis = this;

  oThis.receiverAddress = params.receiver_address;
  oThis.value = params.value;
};

GiveTestOstKlass.prototype = {

  /**
   * Perform<br><br>
   *
   * @return {promise<result>} - returns a promise which resolves to an object of kind Result
   */
  perform: async function() {
    const oThis = this;

    var senderAddress = coreAddresses.getAddressForUser(senderUser);
    var senderPassPhrase = coreAddresses.getPassphraseForUser(senderUser);

    if(isNaN(oThis.value)){
      return Promise.resolve(responseHelper.error('s_ft_gto_1', 'Invalid amount to transfer.'));
    }

    var amountInwei = (new BigNumber(oThis.value)).mul(etherToWeiCinversion);

    var transactionHash = await simpleTokenContractObj.transfer(senderAddress, senderPassPhrase, oThis.receiverAddress, amountInwei, true);

    return Promise.resolve(responseHelper.successWithData({transactionHash: transactionHash}));

  }

};

module.exports = GiveTestOstKlass;