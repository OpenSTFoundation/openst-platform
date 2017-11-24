"use strict";

/*
 * Constants file
 *
 * * Author: Rachin
 * * Date: 16/10/2017
 * * Reviewed by:
 */

const rootPrefix = '../..'
  , web3ValueWsProvider = require(rootPrefix+'/lib/web3/providers/value_ws')
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  , eventQueueManagerKlass = require(rootPrefix+'/services/inter_comm/event_queue_manager')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , stakingContractName = 'staking'
  , stakingContractAddress = coreAddresses.getAddressForContract(stakingContractName)
  ;

//Singleton contract object for listening to events.
const stakingContract = (function () {

  const contractAbi = coreAddresses.getAbiForContract(stakingContractName)
    , contract = new web3ValueWsProvider.eth.Contract( contractAbi, stakingContractAddress )
    ;

  contract.setProvider( web3ValueWsProvider.currentProvider );

  return contract;

})();

const interComm = {

  init: function () {
    this.bindStakeEvents();
  },

  //Generic Method to log event subscription error
  onEventSubscriptionError: function ( error ) {
    logger.log("onEventSubscriptionError triggered");
    logger.error(error);
  },

  //Generic Method to log any event.
  describeEvent: function ( eventObj, contractName ) {
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

  },

  stakingContract: stakingContract,

  bindStakeEvents: function () {
    if ( !interComm.stakingContract.events.MintingIntentDeclared ) {
      logger.error("MintingIntentDeclared event missing in Staking Contract");
    } else {
      logger.log("bindStakeEvents binding MintingIntentDeclared");
      interComm.stakingContract.events.MintingIntentDeclared({})
        .on('error', function(errorObj){
          logger.win("error :: MintingIntentDeclared");
          interComm.onEventSubscriptionError( errorObj );
        })
        .on('data', function(eventObj){
          logger.win("data :: MintingIntentDeclared");
          interComm.onMintingIntentDeclared( eventObj );
        })
        .on('changed', function(eventObj){
          logger.win("changed :: MintingIntentDeclared");
          interComm.onMintingIntentDeclared( eventObj );
        })
    }
    logger.log("bindStakeEvents done");
  },

  onMintingIntentDeclared: function ( eventObj ) {

    const eventQueueManager = new eventQueueManagerKlass(stakingContract);

    eventQueueManager.addEditEventInQueue(eventObj);

  }

};

interComm.init();
logger.win("interComm initiated");
