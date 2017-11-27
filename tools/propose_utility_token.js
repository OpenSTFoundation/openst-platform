"use strict";

const rootPrefix = '..'
  , openSTUtilityContractInteractKlass = require(rootPrefix+'/lib/contract_interact/openst_utility')
  , openSTUtilityContractInteract = new openSTUtilityContractInteractKlass()
  ;


const ProposeUtilityToken = function() {};

ProposeUtilityToken.prototype = {

  perform: function (senderAddress, senderPassphrase, symbol, name, conversionRate) {
    return openSTUtilityContractInteract.proposeBrandedToken(
      senderAddress,
      senderPassphrase,
      symbol,
      name,
      conversionRate
    ).then(function(transactionReceiptResult){
      console.log(transactionReceiptResult);
    });
  }
};

module.exports = ProposeUtilityToken;