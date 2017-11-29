"use strict";

//All node module requires.
const fs = require('fs')
  , path = require('path')
;

//All other requires.
const rootPrefix = '..'
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , coreConstants = require(rootPrefix+"/config/core_constants")
  , openSTUtilityContractInteractKlass = require(rootPrefix+'/lib/contract_interact/openst_utility')
  , UtilityRegistrarContractInteract = require( rootPrefix + '/lib/contract_interact/utility_registrar' )
  , ValueRegistrarContractInteract = require( rootPrefix + '/lib/contract_interact/value_registrar' )
  , web3EventsFormatter = require(rootPrefix+'/lib/web3/events/formatter')
;


//All other const
const contractName = 'openSTUtility'
  , currContractAddr = coreAddresses.getAddressForContract(contractName)
  , openSTUtilityContractInteract = new openSTUtilityContractInteractKlass( currContractAddr )
  , utilityRegistrarContractAddress = coreAddresses.getAddressForContract("utilityRegistrar")
  , utilityRegistrarContractInteract = new UtilityRegistrarContractInteract(utilityRegistrarContractAddress)
  , valueRegistrarContractAddress = coreAddresses.getAddressForContract("valueRegistrar")
  , valueRegistrarContractInteract = new ValueRegistrarContractInteract( valueRegistrarContractAddress )
  , utilityChainId = coreConstants.OST_UTILITY_CHAIN_ID
  , openSTUtilityAddr = coreAddresses.getAddressForContract("openSTUtility")
  , openSTValueAddr = coreAddresses.getAddressForContract("openSTValue")
;


const InitUtilityToken = function(autoApprove) {
  if (typeof autoApprove !== "undefined") {
    this.autoApprove = autoApprove;
  }
};

InitUtilityToken.prototype = {
  constructor: InitUtilityToken

  , autoApprove: true /* Setting this flag to true, auto approves the regitration. To be used by Bot Api */

  , propose: function (
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
          return oThis.registerOnUtility(formattedTransactionReceipt);
        } else {
          return Promise.resolve(transactionReceiptResult);
        }
      }
    });
  }

  , registerOnUtility: async function (formattedTransactionReceipt) {
    const oThis = this
      , formattedEvents = await web3EventsFormatter.perform(formattedTransactionReceipt);

    var registerParams = formattedEvents['ProposedBrandedToken'];

    if ( !registerParams ) {
      return Promise.reject("Did not find ProposedBrandedToken event payload!");
    }


    registerParams[ "_registry" ] = registerParams.address;
    console.log(">> registerOnUtility :: registerParams \n\t", JSON.stringify(registerParams, null, 4) );

    

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

    const registrarAddress  = coreAddresses.getAddressForUser('utilityRegistrar')
      , registrarPassphrase = coreAddresses.getPassphraseForUser('utilityRegistrar')
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
      console.log("registerOnUC :: transactionReceiptResult");
      console.log( JSON.stringify(transactionReceiptResult) );
      const formattedTransactionReceipt = transactionReceiptResult.data.formattedTransactionReceipt;
      return oThis.registerOnValue(formattedTransactionReceipt);
    });
  }

  , registerOnValue: async function ( formattedUtilityReceipt ) {
    const oThis = this
      , formattedEvents = await web3EventsFormatter.perform( formattedUtilityReceipt );


    var registerParams = formattedEvents['RegisteredBrandedToken'];


    console.log( "=====>", JSON.stringify( formattedEvents, null, 2) );

    if ( !registerParams ) {
      return Promise.reject("Did not find RegisteredBrandedToken event payload!");
    }


    const mustHaveParams = [ "_requester", "_token", "_uuid", "_symbol", "_name", "_conversionRate"];

    //Validate Params.
    //..Create Array.some callback. It should return true if any param is missing. 
    const isMissing = function ( eventName ) {
      return (typeof registerParams[ eventName ] === "undefined");
    }
    //..Check it.
    if ( mustHaveParams.some(isMissing) ) {
      return Promise.reject("Required parameters missing. Can not perform registerUtilityToken. registerParams: ", JSON.stringify(registerParams) );
    }

    const registrarAddress  = coreAddresses.getAddressForUser('valueRegistrar')
      , registrarPassphrase = coreAddresses.getPassphraseForUser('valueRegistrar')
    ;

    console.log("\n registerOnValue valueRegistrar : ", registrarAddress);

    console.log("registerParams", JSON.stringify(registerParams, null, 2) );


    return valueRegistrarContractInteract.registerUtilityToken(
      registrarAddress,
      registrarPassphrase,
      openSTValueAddr,
      registerParams["_symbol"],
      registerParams["_name"],
      registerParams["_conversionRate"],
      utilityChainId,
      registerParams["_requester"],
      registerParams["_uuid"]
    ).then( function(transactionReceiptResult) {
      console.log("registerOnVC :: transactionReceiptResult");
      console.log( JSON.stringify(transactionReceiptResult, null, 2) );

      const formattedValueReceipt = transactionReceiptResult.data.formattedTransactionReceipt;

      return oThis.registerOnConfig( formattedUtilityReceipt, formattedValueReceipt );
    });
  }

  , registerOnConfig: async function ( formattedUtilityReceipt, formattedValueReceipt ) {

    const oThis = this
      , utilityEvents = await web3EventsFormatter.perform( formattedUtilityReceipt )
      , valueEvents =  await web3EventsFormatter.perform( formattedValueReceipt )
    ;


    var utilityOutput = utilityEvents[ "RegisteredBrandedToken" ]
      , valueOutput   = valueEvents[ "UtilityTokenRegistered" ]
      , newMember = {
        "Name":             valueOutput[ "_name" ]
        ,"Symbol":          valueOutput[ "_symbol" ]
        ,"ChainId":         valueOutput[ "_chainIdUtility" ]
        ,"ConversionRate":  valueOutput[ "_conversionRate" ]
        ,"Decimals":        valueOutput[ "_decimals" ]
        ,"Reserve":         valueOutput[ "_stakingAccount" ]
        ,"UUID":            valueOutput[ "_uuid" ]
        ,"SimpleStake":     valueOutput[ "stake" ]
        ,"ERC20":       utilityOutput[ "_token" ] 
      }
    ;







    const config = require(rootPrefix + "/config")
      , members = config.Members
      , currSym = valueOutput["_symbol"]
    ;

    var currentMember = members.find( function ( member ) {
      return member.Symbol === currSym;
    });

    if ( !currentMember ) {
      const lowerSymbol = ( currSym ).toLowerCase()
            ,routePath  = lowerSymbol 
            ,uName      = lowerSymbol + "User"
            ,uSecret    = lowerSymbol + "Secret"
      ;

      currentMember = {
        Route: "/" + routePath,
        "ApiAuth": {
            "users": {
                
            }
        },
        "Callback": null
      };

      currentMember.ApiAuth.users[ uName ] = uSecret;

      members.unshift( currentMember );
    }

    for ( var mKey in newMember ) {
      currentMember[ mKey ] = newMember[ mKey ];
    }

    console.log("New Config:", JSON.stringify( currentMember ) );

    return new Promise( (resolve,reject) => {
      const json = JSON.stringify(config, null, 4);
      console.log("Updating Config File:" , path.join(__dirname, '/' + rootPrefix + '/config.json'));
      fs.writeFile(path.join(__dirname, '/' + rootPrefix + '/config.json'), json, err => err ? reject(err) : resolve() );
      console.log("Config file updated!");
    });
  }

};

module.exports = InitUtilityToken;