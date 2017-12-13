"use strict";

/**
 * This is utility class for Initializing Member Company <br><br>
 *
 * @module tools/init_utility_token
 */

//All node module requires.
const fs = require('fs')
  , path = require('path')
;

//All other requires.
const rootPrefix  = '..'
  , coreAddresses                       = require( rootPrefix + '/config/core_addresses')
  , coreConstants                       = require( rootPrefix + '/config/core_constants')
  , openSTUtilityContractInteractKlass  = require( rootPrefix + '/lib/contract_interact/openst_utility')
  , UtilityRegistrarContractInteract    = require( rootPrefix + '/lib/contract_interact/utility_registrar' )
  , ValueRegistrarContractInteract      = require( rootPrefix + '/lib/contract_interact/value_registrar' )
  , web3EventsFormatter                 = require( rootPrefix + '/lib/web3/events/formatter')
  , StPrimeKlass                        = require( rootPrefix + '/lib/contract_interact/st_prime' )
  , logger                              = require( rootPrefix + '/helpers/custom_console_logger')
;


//All other const
const contractName                    = 'openSTUtility'
  , currContractAddr                  = coreAddresses.getAddressForContract(contractName)
  , openSTUtilityContractInteract     = new openSTUtilityContractInteractKlass( currContractAddr )
  , utilityRegistrarContractAddress   = coreAddresses.getAddressForContract("utilityRegistrar")
  , utilityRegistrarContractInteract  = new UtilityRegistrarContractInteract(utilityRegistrarContractAddress)
  , valueRegistrarContractAddress     = coreAddresses.getAddressForContract("valueRegistrar")
  , valueRegistrarContractInteract    = new ValueRegistrarContractInteract( valueRegistrarContractAddress )
  , utilityChainId                    = coreConstants.OST_UTILITY_CHAIN_ID
  , openSTUtilityAddr                 = coreAddresses.getAddressForContract("openSTUtility")
  , openSTValueAddr                   = coreAddresses.getAddressForContract("openSTValue")
  // , stPrimeAddress        = coreAddresses.getAddressesForContract( "stPrime" )
  , stPrimeAddress                    = null
  , stPrime                           = new StPrimeKlass( stPrimeAddress )

;

/**
 *
 * @constructor
 *
 * @param {Boolean} autoApprove - Boolean governing if this member needs an
 * approval of STC to stake & mint Branded Tokens
 *
 */
const InitUtilityToken = function(autoApprove) {
  if (typeof autoApprove !== "undefined") {
    this.autoApprove = autoApprove;
  }
};

InitUtilityToken.prototype = {

  constructor: InitUtilityToken

  /**
   * Member Config Object initialize
   */
  , memberDefaults : null

  /**
   * Setting this flag to true, auto approves the regitration. To be used by Bot Api
   */
  , autoApprove: true

  /**
   * Creates Config for a new Member Company
   *
   * @param {String} symbol - symbol which MC wants to use for BT
   * @param {String} name - member company's name
   * @param {String} apiAuthUser - username for HTTP AUTH (to be used in API calls)
   * @param {String} apiAuthSecret - password for HTTP AUTH (to be used in calls)
   * @param {String} callbackUrl - Member Company's URL which would be called as a callback
   *
   * @return {Object}
   *
   */
  , newMemberWithConfig: function ( symbol, name, apiAuthUser, apiAuthSecret, callbackUrl ) {
    const oThis = this;

    logger.step("Creating new member account");
    return stPrime.newMemberManagedAccount()
      .then( response => {
        if ( !response.isSuccess() ) {
          logger.error("Failed to create new member account");
          return Promise.reject({});
        } else {
          const mcAddress = response.data.address
            , mcPassphrase = stPrime.getMemberPassphrase( mcAddress )
          ;
          logger.info("Address :: ", mcAddress, "Passphrase :: ", mcPassphrase);
          logger.win("New Member company address :: ", mcAddress);
          
          return oThis.generateMemberDefaults(mcAddress, symbol, apiAuthUser, apiAuthSecret, callbackUrl)
            .then( config => {
              return {
                "address"       : mcAddress
                , "passphrase"  : mcPassphrase
                , "config"      : config
              };
            });
          ;
        }
      })
  }

  /**
   * Proposes a Member Company
   *
   * @param {String} senderAddress - Address which is proposing this Member Company
   * @param {String} symbol - symbol for BT which is being proposed
   * @param {String} name - name for BT which is being proposed
   * @param {String} conversionRate - conversion rate for BT (with respect to ST) which is being proposed
   *
   * @return {Result}
   *
   */
  , propose: function (
    senderAddress,
    symbol,
    name,
    conversionRate
  ) {
    const oThis = this;

    const senderPassphrase = stPrime.getMemberPassphrase( senderAddress );

    logger.step("Proposing Branded Token for senderAddress: ", senderAddress);

    return openSTUtilityContractInteract.proposeBrandedToken(
      senderAddress,
      senderPassphrase,
      symbol,
      name,
      conversionRate
    ).then(function( response ){

      if ( !response.isSuccess() ) {
        logger.error("propossedBrandedToken failed!");
        logger.log( JSON.stringify( response ) );
        return response;
      }

      logger.win("propossedBrandedToken successfull");
      logger.log( JSON.stringify( response ) );

      if ( oThis.autoApprove ) {
        const formattedTransactionReceipt = response.data.formattedTransactionReceipt;
        return oThis.registerOnUtility(formattedTransactionReceipt);
      } else {
        return response;
      }

    });
  }

  /**
   * Register a Member Company on Utility Chain
   *
   * @param {Result} formattedTransactionReceipt - Transaction Data from proposeBrandedToken method
   *
   * @return {Result}
   *
   */
  , registerOnUtility: async function (formattedTransactionReceipt) {
    const oThis = this;

    logger.step("registerOnUtility called.");
    logger.info("formattedTransactionReceipt\n", JSON.stringify( formattedTransactionReceipt ) );

    const formattedEvents = await web3EventsFormatter.perform(formattedTransactionReceipt);

    var registerParams = formattedEvents['ProposedBrandedToken'];

    if ( !registerParams ) {
      logger.error("Did not find ProposedBrandedToken event payload!");
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
    var missingParam = mustHaveParams.find(isMissing);
    if ( missingParam ) {
      logger.error("registerOnUtility :: Required parameters missing. missingParam :", missingParam);
      logger.log("registerOnUtility :: registerParams \n\t", JSON.stringify(registerParams, null, 4) );
      return Promise.reject( "Required parameters missing." );
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
    ).then( function( response ) {
      if ( response.isSuccess() ) {
        logger.win("registerOnUC Successfull. response");
        logger.log( JSON.stringify( response ) );
        const formattedTransactionReceipt = response.data.formattedTransactionReceipt;
        return oThis.registerOnValue(formattedTransactionReceipt);        
      } else {
        logger.error("registerOnUC failed.");
        logger.log( JSON.stringify( response ) );
        return response;
      }

    });
  }

  /**
   * Register a Member Company on Value Chain
   *
   * @param {Result} formattedTransactionReceipt - Transaction Data from registerBrandedToken on utility method
   *
   * @return {Result}
   *
   */
  , registerOnValue: async function ( formattedUtilityReceipt ) {
    const oThis = this;

    logger.step("registerOnValue called.");
    logger.info("registerOnValue :: formattedTransactionReceipt\n", JSON.stringify( formattedUtilityReceipt ) );

    const formattedEvents = await web3EventsFormatter.perform( formattedUtilityReceipt );

    var registerParams = formattedEvents['RegisteredBrandedToken'];


    

    if ( !registerParams ) {
      logger.error("registerOnValue :: Did not find RegisteredBrandedToken event payload!");
      return Promise.reject("Did not find RegisteredBrandedToken event payload!");
    }


    const mustHaveParams = [ "_requester", "_token", "_uuid", "_symbol", "_name", "_conversionRate"];

    //Validate Params.
    //..Create Array.some callback. It should return true if any param is missing. 
    const isMissing = function ( eventName ) {
      return (typeof registerParams[ eventName ] === "undefined");
    };
    //..Check it.
    var missingParam = mustHaveParams.find(isMissing);
    if ( missingParam ) {
      logger.error("registerOnValue :: Required parameters missing. missingParam :", missingParam);
      logger.log( JSON.stringify( formattedEvents, null, 2) );
      return Promise.reject("Required parameters missing. Can not perform registerUtilityToken. registerParams: ", JSON.stringify(registerParams) );
    }

    const registrarAddress  = coreAddresses.getAddressForUser('valueRegistrar')
      , registrarPassphrase = coreAddresses.getPassphraseForUser('valueRegistrar')
    ;

    logger.log("\n registerOnValue valueRegistrar : ", registrarAddress);

    logger.log("registerParams", JSON.stringify(registerParams, null, 2) );


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
    ).then( function( response ) {
      if ( !response.isSuccess() ) {
        logger.error("registerOnVC Failed. response");
        logger.log( JSON.stringify(response, null, 2) );
        return response;
      }

      logger.win("registerOnVC Successfull. transactionReceiptResult ::");
      logger.log( JSON.stringify(response, null, 2) );

      const formattedValueReceipt = response.data.formattedTransactionReceipt;

      return oThis.registerOnConfig( formattedUtilityReceipt, formattedValueReceipt );
    });
  }

  /**
   * Register a Member Company's Config
   *
   * @param {Result} formattedUtilityReceipt - Transaction Data from registerBrandedToken on utility method
   * @param {Result} formattedValueReceipt - Transaction Data from registerBrandedToken on value method
   *
   * @return {Result}
   *
   */
  , registerOnConfig: async function ( formattedUtilityReceipt, formattedValueReceipt ) {
    const oThis = this;
    logger.step("registerOnConfig called.");

    const utilityEvents = await web3EventsFormatter.perform( formattedUtilityReceipt )
      , valueEvents =  await web3EventsFormatter.perform( formattedValueReceipt )
    ;


    var utilityOutput = utilityEvents[ "RegisteredBrandedToken" ]
      , valueOutput   = valueEvents[ "UtilityTokenRegistered" ]
      , newMember = {
        "Name"            : valueOutput[ "_name" ]
        ,"Symbol"         : valueOutput[ "_symbol" ]
        ,"ChainId"        : valueOutput[ "_chainIdUtility" ]
        ,"ConversionRate" : valueOutput[ "_conversionRate" ]
        ,"Decimals"       : valueOutput[ "_decimals" ]
        ,"Reserve"        : valueOutput[ "_stakingAccount" ]
        ,"UUID"           : valueOutput[ "_uuid" ]
        ,"SimpleStake"    : valueOutput[ "stake" ]
        ,"ERC20"       : utilityOutput[ "_token" ] 
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
      currentMember = oThis.getMemberDefaults( valueOutput[ "_stakingAccount" ], currSym );
      members.unshift( currentMember );
    }

    for ( var mKey in newMember ) {
      currentMember[ mKey ] = newMember[ mKey ];
    }

    logger.log("New Config:", JSON.stringify( currentMember ) );

    return new Promise( (resolve,reject) => {
      const json = JSON.stringify(config, null, 4);
      logger.log("Updating Config File:" , path.join(__dirname, '/' + rootPrefix + '/config.json'));
      fs.writeFile(path.join(__dirname, '/' + rootPrefix + '/config.json'), json, err => err ? reject(err) : resolve() );
      logger.log("Config file updated!");
    });
  }

  /**
   * Get Member Company's Default Config
   *
   * @param {String} reserve - address for Member Company's Reserve
   * @param {String} symbol - symbol for BT which is being proposed
   * @param {String} apiAuthUser - username for HTTP AUTH (to be used in API calls)
   * @param {String} apiAuthSecret - password for HTTP AUTH (to be used in calls)
   * @param {String} callbackUrl - Member Company's URL which would be called as a callback
   *
   * @return {Object}
   *
   */
  , getMemberDefaults: function ( reserve, symbol, apiAuthUser, apiAuthSecret, callbackUrl) {
    const oThis = this;
    const lowerSymbol = ( symbol ).toLowerCase();
    const routePath = "/" + lowerSymbol;

    if ( oThis.memberDefaults ) {
      return oThis.memberDefaults;
    }

    if ( !apiAuthUser ) {
      apiAuthUser = lowerSymbol + "User";
    }

    if ( !apiAuthSecret ) {
      apiAuthSecret = lowerSymbol + "Secret";
    }

    var currentMember = oThis.memberDefaults = {
      "Reserve"   : reserve || null
      , "Symbol"  : symbol
      , "Route"   :  routePath
      , "ApiAuth" : {
        "users"   : {}
      }
      , "Callback": callbackUrl
    };

    currentMember.ApiAuth.users[ apiAuthUser ] = apiAuthSecret;

    logger.info("New member config defaults generated.", oThis.memberDefaults);

    return oThis.memberDefaults;

  }

  , generateMemberDefaults: function ( reserve, symbol, apiAuthUser, apiAuthSecret, callbackUrl) {
    const oThis = this;
    oThis.memberDefaults = null;

    const config = require(rootPrefix + "/config")
      , members = config.Members
    ;

    var newDefaults = oThis.getMemberDefaults( reserve, symbol, apiAuthUser, apiAuthSecret, callbackUrl);

    members.unshift( newDefaults );

    return new Promise( (resolve,reject) => {
      const json = JSON.stringify(config, null, 4);
      const configFilePath = coreConstants.OST_MEMBER_CONFIG_FILE_PATH;
      logger.log("Updating Config File:" , configFilePath );
      fs.writeFile(configFilePath, json, err => err ? reject(err) : resolve() );
      logger.log("Config file updated!");
    }).then( _ => {
      return newDefaults;
    });
  }
  

};

module.exports = InitUtilityToken;