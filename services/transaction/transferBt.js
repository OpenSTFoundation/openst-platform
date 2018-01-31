"use strict";

/**
 * Get Transaction Receipt
 */

const rootPrefix = '../..'
  , BrandedTokenContractInteractKlass = require(rootPrefix + '/lib/contract_interact/branded_token')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , batchSize = 2
  ;

var promiseArray = []
  , keysArray = []
  , responseTransactions = {};
  ;


const getTransactionReceipt = async function (reqParams) {
  try {

    var erc20Addr = reqParams['erc20']
      , reserveAddr = reqParams['reserve']
      , transferData = reqParams['transfers']
      , transferDataLength = Object.keys(transferData).length
      , i = 0
    ;

    for(var key in transferData) {
      var t_d = transferData[key]
        , brandedTokenObj = new BrandedTokenContractInteractKlass(
          {
            "ERC20": erc20Addr,
            "Reserve": reserveAddr
          });

      console.log("Transfer Initiated for ---------> ", t_d);
      promiseArray.push(brandedTokenObj.transfer(t_d['fromAddr'], t_d['toAddr'], t_d['amountWei']));
      keysArray.push(key);

      if((((i + 1) % batchSize) == 0) || ((i+1) == transferDataLength)) {

        var transferResponses = await Promise.all(promiseArray);

        for(var j=0; j < transferResponses.length; j++){
          var transferResponse = transferResponses[j];
          if(transferResponse.isSuccess()){
            responseTransactions[keysArray[j]] = transferResponse.data.transaction_hash;
          } else {
            responseTransactions[keysArray[j]] = '';
          }
        }

        keysArray = [];
        promiseArray = [];
      }
      i++;
    }

    console.log("CCCCCoooooooooooooooommmmmpppleted--------------------------------------------", responseTransactions);

  } catch (err) {
    return Promise.reject('Something went wrong. ' + err.message)
  }
};

module.exports = getTransactionReceipt;