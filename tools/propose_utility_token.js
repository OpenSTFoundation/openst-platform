"use strict";

const rootPrefix = '..'
  , contractName = 'openSTUtility'
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , currContractAddr = coreAddresses.getAddressForContract(contractName)
  , openSTUtilityContractInteractKlass = require(rootPrefix+'/lib/contract_interact/openst_utility')
  , UtilityRegistrarContractInteract = require( rootPrefix + '/lib/contract_interact/utility_registrar' )
  , openSTUtilityContractInteract = new openSTUtilityContractInteractKlass( currContractAddr )
  , utilityRegistrarContractAddress = coreAddresses.getAddressForContract("utilityRegistrar")
  , utilityRegistrarContractInteract = new UtilityRegistrarContractInteract(utilityRegistrarContractAddress)

;


const ProposeUtilityToken = function( autoApprove ) {
  if ( typeof autoApprove !== "undefined" ) {
    this.autoApprove = autoApprove;
  }
};

ProposeUtilityToken.prototype = {

  autoApprove: true, /* Setting this flag to true, auto approves the regitration. To be used by Bot Api */

  perform: function (senderAddress, senderPassphrase, symbol, name, conversionRate) {
    const oThis = this;

    return openSTUtilityContractInteract.proposeBrandedToken(
      senderAddress,
      senderPassphrase,
      symbol,
      name,
      conversionRate
    ).then(function(transactionReceiptResult){
      console.log( JSON.stringify(transactionReceiptResult) );

      if ( transactionReceiptResult.isSuccess() ) {

        if ( oThis.autoApprove ) {
          const formattedTransactionReceipt = transactionReceiptResult.data.formattedTransactionReceipt;
          return oThis.registerBrandedTokenOnUC( formattedTransactionReceipt );
        }        

      }

    });
  },

  registerBrandedTokenOnUC: function ( formattedTransactionReceipt ) {
    const oThis =this;

    const eventsData = formattedTransactionReceipt.eventsData;

    var proposedBTPayload = null; //proposedBrandedTokenEventPayload

    //Read data from receipt.
    const registerParams = {
      "_registry": null
    };

    var eventKey, eventObj, eventName, eventValue;
    for( eventKey in eventsData){
      eventObj =  eventsData[ eventKey ];
      eventName = String( eventObj.name );

      if ( eventName.toLowerCase() === ("ProposedBrandedToken").toLowerCase() ) {
        //We found our eventPayload.
        proposedBTPayload = eventObj;
        registerParams[ "_registry" ] = eventObj.address;
        break;
      }
    }

    if ( !proposedBTPayload ) {
      return Promise.reject("Did not find ProposedBrandedToken event payload!");
    }


    const mustHaveParams = ["_registry", "_requester", "_token", "_uuid", "_symbol", "_name", "_conversionRate"];

    for( eventKey in proposedBTPayload.events ) {
      eventObj    = proposedBTPayload.events[ eventKey ];
      eventName   = String( eventObj.name );
      if ( !eventName ) {
        console.warn("name not defined for event ", JSON.stringify( eventObj ) );
        continue;
      }

      eventValue = eventObj.value;
      if ( !eventValue ) {
        console.warn("eventValue not defined for event ", JSON.stringify( eventObj ) );
        continue;
      }

      registerParams[ eventName ] = eventValue;

    }

    //Validate Params.
    //..Create Array.some callback. It should return true if any param is missing. 
    const isMissing = function ( eventName ) {
      return (typeof registerParams[ eventName ] === "undefined");
    }
    //..Check it.
    if ( mustHaveParams.some(isMissing) ) {
      return Promise.reject("Required parameters missing. Can not perform registerBrandedToken. registerParams: ", JSON.stringify(registerParams) );
    }

    const registrarAddress  = coreAddresses.getAddressForUser('deployer')
      , registrarPassphrase = coreAddresses.getPassphraseForUser('deployer')
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
    ).then( transactionReceiptResult => {
      console.log("registerBrandedToken :: transactionReceiptResult");
      console.log( JSON.stringify( transactionReceiptResult ) );
      return Promise.resolve( transactionReceiptResult );
    });

  }



};

module.exports = ProposeUtilityToken;