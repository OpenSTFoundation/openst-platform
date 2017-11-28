"use strict";

const rootPrefix = '..'
  , contractName = 'openSTUtility'
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , openSTUtilityContractInteractKlass = require(rootPrefix+'/lib/contract_interact/openst_utility')
  , UtilityRegistrarContractInteract = require( rootPrefix + '/lib/contract_interact/utility_registrar' )
  , web3EventsFormatter = require(rootPrefix+'/lib/web3/events/formatter')
  , currContractAddr = coreAddresses.getAddressForContract(contractName)
  , openSTUtilityContractInteract = new openSTUtilityContractInteractKlass( currContractAddr )
  , utilityRegistrarContractAddress = coreAddresses.getAddressForContract("utilityRegistrar")
  , utilityRegistrarContractInteract = new UtilityRegistrarContractInteract(utilityRegistrarContractAddress)
  ;


const InitUtilityToken = function(autoApprove) {
  if (typeof autoApprove !== "undefined") {
    this.autoApprove = autoApprove;
  }
};

InitUtilityToken.prototype = {

  autoApprove: true, /* Setting this flag to true, auto approves the regitration. To be used by Bot Api */

  propose: function (
    senderAddress,
    senderPassphrase,
    symbol,
    name,
    conversionRate
  ) {
    const oThis = this;

    return openSTUtilityContractInteract.proposeBrandedToken(
      senderAddress,
      senderPassphrase,
      symbol,
      name,
      conversionRate
    ).then(function(transactionReceiptResult){

      console.log("propossedBrandedToken :: transactionReceiptResult");
      console.log( JSON.stringify(transactionReceiptResult) );

      if ( transactionReceiptResult.isSuccess() ) {
        if ( oThis.autoApprove ) {
          const formattedTransactionReceipt = transactionReceiptResult.data.formattedTransactionReceipt;
          return oThis.registerOnUC(formattedTransactionReceipt);
        } else {
          return Promise.resolve(transactionReceiptResult);
        }
      }
    });
  },

  registerOnUC: async function (formattedTransactionReceipt) {
    const oThis = this
      , formattedEvents = await web3EventsFormatter.perform(formattedTransactionReceipt);

    var registerParams = formattedEvents['ProposedBrandedToken'];

    if ( !registerParams ) {
      return Promise.reject("Did not find ProposedBrandedToken event payload!");
    }

    registerParams[ "_registry" ] = registerParams.address;

    const mustHaveParams = ["_registry", "_requester", "_token", "_uuid", "_symbol", "_name", "_conversionRate"];

    //Validate Params.
    //..Create Array.some callback. It should return true if any param is missing. 
    const isMissing = function ( eventName ) {
      return (typeof registerParams[ eventName ] === "undefined");
    };
    //..Check it.
    if ( mustHaveParams.some(isMissing) ) {
      return Promise.reject("Required parameters missing. Can not perform registerBrandedToken. registerParams: ", JSON.stringify(registerParams) );
    }

    const registrarAddress  = coreAddresses.getAddressForUser('registrar')
      , registrarPassphrase = coreAddresses.getPassphraseForUser('registrar')
    ;


    return utilityRegistrarContractInteract.registerBrandedToken(
      registrarAddress,
      registrarPassphrase,
      registerParams["_registry"],
      registerParams["_symbol"],
      registerParams["_name"],
      registerParams["_conversionRate"],
      registerParams["_requester"],
      registerParams["_token"],
      registerParams["_uuid"],
    ).then( function(transactionReceiptResult) {
      console.log("registerBrandedToken :: transactionReceiptResult");
      console.log( JSON.stringify(transactionReceiptResult) );
      return Promise.resolve( transactionReceiptResult );
    });

  }

};

module.exports = InitUtilityToken;