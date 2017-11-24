"use strict";

/*
 * Constants file
 *
 * * Author: Rachin
 * * Date: 16/10/2017
 * * Reviewed by: 
 */


const Web3 = require("web3")
  , rootPrefix = ".."
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , Geth = require(rootPrefix + '/lib/geth')
  , STAKE_CONTRACT = coreAddresses.getAddressesForContract('staking')
  , UtilityToken = require(rootPrefix + '/lib/bt')
  ;

var valueChain = Geth.ValueChainWS;

const stakingContract = (function () {
  const ContractJson = require( rootPrefix + "/contracts/Staking.json")
        ,contractAddress = STAKE_CONTRACT
        ,contractAbi = JSON.parse( ContractJson.contracts["Staking.sol:Staking"].abi )
        ,contract = new valueChain.eth.Contract( contractAbi, contractAddress )
  ;
  contract.setProvider( valueChain.currentProvider );
  return contract;
})();

const registrar = module.exports = {
  _secret: coreAddresses.getPassphraseForUser('registrar')
  ,valueChain: valueChain
  ,eventProcessingDelay: 100
  ,init: function () {
    this.bindStakeEvents();
  }
  //Generic Method to log event subscription error
  ,onEventSubscriptionError: function ( error ) {
    logger.log("onEventSubscriptionError triggered");
    logger.error(error);
  }
  //Generic Method to log any event.
  ,describeEvent: function ( eventObj, contractName ) {
    const eventId = eventObj.id
          ,name = eventObj.event
          ,address = eventObj.address
          ,transactionHash = eventObj.transactionHash
    ;
    logger.log(
      "----------- Describing" , eventId
      ,"\n Contract:", contractName
      ,"\n Event:" , name
      ,"\n transactionHash: ", transactionHash
      ,"\n address:", address
      ,"\n\n", JSON.stringify( eventObj )
      ,"\n\n----------- Description Ends."
    );

  }
  ,stakingContract: stakingContract
  ,bindStakeEvents: function () {
    if ( !registrar.stakingContract.events.MintingIntentDeclared ) {
      logger.error("MintingIntentDeclared event missing in Staking Contract");
    } else {
      logger.log("bindStakeEvents binding MintingIntentDeclared");
      registrar.stakingContract.events.MintingIntentDeclared({})
        .on('error', (errorObj =>{
          logger.win("error :: MintingIntentDeclared");
          registrar.onEventSubscriptionError( errorObj );
        }))
        .on('data', (eventObj => {
          logger.win("data :: MintingIntentDeclared");
          registrar.onMintingIntentDeclared( eventObj );
        }))
        .on('changed', (eventObj => {
          logger.win("changed :: MintingIntentDeclared");
          registrar.onMintingIntentDeclared( eventObj );
        }))
    }
    logger.log("bindStakeEvents done");
  }

  ,handlerQueue: {}
  ,onMintingIntentDeclared: function ( eventObj ) {
    const eventId = eventObj.id;

    if ( registrar.handlerQueue[ eventId ] ) {
      //We have received this event before. It may have been changed/removed.
      if ( eventObj.removed ) {
        //Lets remove it.
        registrar.removeIntent( eventObj );
      } else {
        //Lets update it.
        registrar.updateIntent( eventObj );
      }
    }
    else if ( eventObj.removed ) {
      //Lets ignore it. We had nothing to do with it anyway.
      return;
    } else {
      //This is a new event. Lets queue it.
      registrar.queueIntent( eventObj );
    }

    //This is new event or has changed. Lets queue it.
    registrar.handlerQueue[ eventId ] = eventObj;
  }

  ,queueIntent: function ( eventObj ) {
    const eventId = eventObj.id;
    const handlerQueue = registrar.handlerQueue;

    logger.info("Queuing", eventId);
    registrar.describeEvent(eventObj, "Staking");

    //Sanity Check
    if ( handlerQueue[ eventId ] ) {
      logger.error(eventId, " has already been queued");
      return;
    }
    


    //Create intent handler
    const _handler = new MintingIntentHandler( eventObj, stakingContract );

    //Set the onProcessCallback
    _handler.setOnProcessCallback(function ( eventObj, success ) {
      if ( eventId ) {
        logger.info(eventId, "has been processed successfully.");
      } else {
        logger.error(eventId, "has been processed successfully.");
      }
      registrar.dequeueIntent( eventObj )
    });

    //If its a valid event scheduleProcessing.
    if ( !_handler.isValid() ) {
      logger.warn("queueIntent :: Intent is not valid.", _handler.getEventDescription() );
      return;
    }
    _handler.scheduleProcessing( registrar.eventProcessingDelay );

    //Just for the sake of it.
    handlerQueue[ eventId ] = _handler;
  }
  ,updateIntent: function ( eventObj ) {
    const eventId = eventObj.id;
    const handlerQueue = registrar.handlerQueue;
    const _handler = handlerQueue[ eventId ];

    if ( !_handler ) {
      logger.info("updateIntent :: _handler is null");
      return;
    }

    //Cancel Scheduled Processing.
    _handler.cancelProcessing();

    //Update Event Data.
    _handler.setEventData( eventObj );

    //If its a valid event scheduleProcessing.
    if ( !_handler.isValid() ) {
      logger.warn("updateIntent :: Intent is not valid.", _handler.getEventDescription() );
      return;
    }
    _handler.scheduleProcessing( registrar.eventProcessingDelay );

    //Just for the sake of it.
    handlerQueue[ eventId ] = _handler;
  }
  ,removeIntent: function ( eventObj ) {
    const eventId = eventObj.id;
    const handlerQueue = registrar.handlerQueue;
    const _handler = handlerQueue[ eventId ];

    logger.warn(eventId, "has been removed");
    registrar.describeEvent(eventObj, "Staking");

    if ( !_handler ) {
      return;
    }

    //Cancel Scheduled Processing.
    _handler.cancelProcessing();

    //Dequeue it.
    registrar.dequeueIntent( eventObj );


  }
  ,dequeueIntent: function ( eventObj ) {
    const eventId = eventObj.id;
    const handlerQueue = registrar.handlerQueue;
    const _handler = handlerQueue[ eventId ];

    if ( !_handler ) {
      return;
    }

    handlerQueue[ eventId ] = null;

    // //Just for the sake of it.
    // if ( _handler.isScheduled ) {
    //   _handler.cancelProcessing();  
    // }
    
  }
};


const MintingIntentHandler = function ( eventObj, stakingContract ) {
  this.setEventData( eventObj );
  this.stakingContract = stakingContract;
};

MintingIntentHandler.prototype = {
  constructor: MintingIntentHandler
  ,stakingContract : null
  
  ,timer: -1
  ,isScheduled: false

  ,eventObj: null
  ,setEventData: function ( eventObj ){
    this.eventObj = eventObj;
  }

  ,onProcessCallback: null
  ,setOnProcessCallback: function ( callback ) {
    this.onProcessCallback = callback;
  }

  ,isValid: function () {
    //Note: Always log the reason is calling an event invalid.

    if( !this.eventObj ) {
      logger.warn("Event Invalid :: eventObj is null ");
      return false;
    } 
    else if ( this.eventObj.removed ) {
      logger.warn("Event Invalid :: removed", this.getEventDescription() );
      return false;
    }

    return true;
  }
  ,scheduleProcessing: function ( timeInMilliSec ) {
    var oThis = this;
    if ( oThis.isScheduled ) {
      logger.warn("MintingIntentHandler :: scheduleProcessing :: Processing is already scheduled.", this.getEventDescription() );
      return;
    }
    oThis.isScheduled = true;
    // oThis.processRequest();
    oThis.timer = setTimeout(function () {
      oThis.processRequest();
    }, timeInMilliSec);
  }
  ,cancelProcessing: function () {
    if ( !this.isScheduled ) {
      logger.warn("MintingIntentHandler :: cancelProcessing :: Processing is NOT scheduled.", this.getEventDescription() );
      return;
    }
    clearTimeout( this.timer );
    this.isScheduled = false;
    this.timer = -1;
  }
  ,processRequest: function () {
    const oThis = this
          ,returnValues = this.eventObj.returnValues
          ,uuid                 = returnValues._uuid
          ,staker               = returnValues._staker
          ,stakerNonce          = returnValues._stakerNonce
          ,amountST             = returnValues._amountST
          ,amountUT             = returnValues._amountUT
          ,escrowUnlockHeight   = returnValues._escrowUnlockHeight
          ,mintingIntentHash    = returnValues._mintingIntentHash

          ,foundation = coreAddresses.getAddressForUser('foundation')
    ;
    if ( !this.isValid() ) {
      logger.warn("MintingIntentHandler :: processRequest :: Intent is not valid.", this.getEventDescription() );
      return;
    }
    logger.info("MintingIntentHandler :: processRequest :: Processing Started.", this.getEventDescription() );

    
    logger.step("Verifying stakingContract registrar");
    oThis.stakingContract.methods.adminAddress().call()
    .catch(  error => {
      logger.error( error.message );
      logger.log( error );
      throw "stakingContract registrar verification failed";
    })
    .then(stakeAdmin => {
      stakeAdmin = stakeAdmin.toLowerCase();
      var registrarAddress = coreAddresses.getAddressForUser('registrar');
      if ( stakeAdmin != registrarAddress ) {
        throw "stakingContract registrar verification failed";
      }
      logger.win("stakingContract registrar verification passed");
      return true;
    })
    .then(isAdminValid => {
      logger.step("Fetching UtilityToken(ERC20) Address");
      return oThis.getStakerERC20Address( staker );
    })
    .then(utilityTokenAddress => {
      //@Kedar. If I comment this block, events are received if stake is done more than once.
      //  But, this is the main part of this script.
      //  Whats happening different here: 
      //  This is first time time in this script that we are talking to utility chain. 
      //  The rest of the script only listens & talks to Value Chain.
      //  Only one other script talks to both chains. test/test_staking.js
      //  The difference is that test/test_staking.js uses RPC to talk to both chains.
      //  This script talks to ValueChain over ws & speaks to UtilityChain over RPC.
      //
      //  How to test it:
      //      tools/stakeAndMint.js expects this script to perform the operation. Hence, we can not use it.
      //      However, test/test_staking.js does the operation below on its own.
      //      test/test_staking.js will fire the same events as tools/stakeAndMint.js
      //      If this block is uncommented, the registrar will race with test/test_staking.js
      //      Only one of them will successed. Other script will fail.
      //
      //    Here is what I do, if this block is uncommented.
      //      I run tools/stakeAndMint.js the first time & test/test_staking.js.
      //
      //  Important: 
      //      If Staking goes through and mint is not performed, 
      //      you will have to redeploy the contracts and UtilityToken
      //      OR create a new member company.
      //    EveryTime You run any deploy script:
      //      Copy the values from config.json to open_st_env_vars.sh and source it.
      //
      //    On the other hand, 
      //      its ok if mint goes through & processStaking & processMinting are not performed.
      //      This will happen if you are running test/test_staking.js & registrar (this script) 
      //      mints before the test_staking script.
      //
      //    Short-Cut for If Staking goes through and mint is not performed scenario
      //      Copy the transaction receipt you see on the console.
      //      Open services/mintingIntentHandler.js (Currently not used by this script)
      //      Search for: If in development, the registrar fails, uncomment and use below code.
      //      Put in the transactionReceipt
      //      run the script from console: node service/mintingIntentHandler.js
      //      It will perform minting & tools/stakeAndMint.js (if running) would complete error free.
      //    
      //    If possible, 
      //      Please host chains on your system & run registrar.
      //      Run tools/stakeAndMint.js from other system connecting to your system.
      //      I am guessing, it has something to do with how web3 manages connections.
      //    
      //  Hope you find the solution!
      //


      logger.win("received utilityTokenAddress", utilityTokenAddress);
      logger.step("Minting UtilityToken");
      const utilityToken = new UtilityToken(staker, utilityTokenAddress);
      return utilityToken.mint( uuid, staker, stakerNonce, amountST, amountUT, escrowUnlockHeight, mintingIntentHash);
    })
    .then(mintEvent => {
      logger.win("Minting Intent has been Confirmed for mintingIntentHash" , mintingIntentHash);
      oThis.triggerProcessCallback( true );
    })
    .catch( (error) => { 
      logger.error( error.message, oThis.getEventDescription());
      //Always mark request as complete.
      oThis.triggerProcessCallback( false );
    })
  }
  ,triggerProcessCallback: function ( success ) {
    this.stakingContract = null;
    this.isScheduled = false;
    this.onProcessCallback && this.onProcessCallback( this.eventObj, success);
    this.eventObj = null;
    this.onProcessCallback = null;

  }
  ,getEventDescription: function () {
    return "IntentHandler EventId: " + this.eventObj.id + " transactionHash: " + this.eventObj.transactionHash;
  }
  ,getStakerERC20Address: function ( staker ) {
    //THIS IS TEMP CODE. THE ACTUAL LOGIC NEEDS TO COME HERE. LCT - Light Coin.
    return new Promise(function (resolve,reject) {
      const Config = require( rootPrefix + '/config.json');
      var erc20 = null;
      Config.Members.some(function ( member ) {
        if ( member.Reserve.toLowerCase() == staker.toLowerCase() ) {
          erc20 = member.ERC20;
          return true;
        }
      });
      if ( erc20 ) {
        logger.info("getStakerERC20Address :: staker", staker, " found erc20", erc20 );
        resolve( erc20 );
      } else {
        reject("ERC20 not found for staker address " , staker);
      }
      
    });
  }
};


MintingIntentHandler.getMintingIntentDeclaredEventFromTransactionReceipt 
= MintingIntentHandler.getEventFromTransactionReceipt
= function ( receipt ) {
  if ( !receipt ) {
    return null;
  }
  const events = receipt.events;
  if ( !events ) {
    return null;
  }
  const mintingIntentDeclared = events.MintingIntentDeclared;
  return mintingIntentDeclared || null;
};


registrar.init();
logger.win("registrar initiated");

