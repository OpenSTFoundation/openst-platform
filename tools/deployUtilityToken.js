"use strict";
/*
 *   Script to deploy Utility-Token. 
 * * Please Verify Config Before Executing this script.
 * * The Script can be used deploy the UtilityToken Contract on the MainNet UtilityChain 
 * *
 * * Author: Rachin Kapoor
 * * Date: 12/10/2017
 * * Reviewed by:
 * * 
 */
const FS = require('fs')
      ,Path = require('path')
      ,UtilityToken = require('../lib/bt')
      ,StakeContract = require('../lib/stakeContract')
      ,Geth = require("../lib/geth")
      ,logger = require("./helpers/CustomConsoleLogger")
      ,Config = require(process.argv[2] || '../config.json')
      ,coreAddresses = require('../config/core_addresses')
      ,UpdateMemberInfo = require("../lib/updateMemberInfo")
      ,REGISTRAR_ADDRESS = coreAddresses.getAddressForUser('registrar')
      ,REGISTRAR_KEY = coreAddresses.getPassphraseForUser('registrar')
      ,readline = require('readline')
      ,UC = "UtilityChain"
      ,UC_MAIN_NET_ID = 1410
;

var is_uc_main_net = false;


//Method to display the exception reason and exit.
function catchAndExit( reason ) {
  if ( reason ){

  }
  reason && console.log( reason );
  process.exit(1);
}


//Method to validate UtilityChain. Ensures no one 'accidentally' deploys on Mainnet.
function validateUtilityChain() {
  logger.step( "Validating", UC );
  return Geth.UtilityChain.eth.net.getId(function (error, result) {
    //Ensure UtilityChain is not on MainNet. networkId should NOT be UC_MAIN_NET_ID.
    if ( result == UC_MAIN_NET_ID ) {
        logger.warn(UC, "is connected to networkId", UC_MAIN_NET_ID ,"(", UC ,"Mainnet)");
        is_uc_main_net = true;
    }
  })
  .catch( reason =>  {
    //Inform user to add 'net' option to rpcapi.
    logger.error( "Could not verify network id of", UC);
    logger.info( "When starting your geth node, make sure to include net and web3 in the --rpcapi argument, e.g. \n        --rpcapi \"net,eth,web3,personal\"");
    catchAndExit( reason );
  })
  .then( networkId => {
    logger.info( UC, "NetworkId: ", networkId );
    logger.info( UC, "HttpProvider.host: ", Geth.UtilityChain.currentProvider.host );
    logger.win( UC, "validated" );
  });
}

function describeMember( member ) {
  logger.step("Describing Member Config.", ( is_uc_main_net ? "Please Confirm these details." : "" ) );
  logger.log("Name ::", member.Name);
  logger.log("Symbol ::", member.Symbol);
  logger.log("Reserve ::\x1b[31m", member.Reserve, logger.CONSOLE_RESET);

  var ignoreKeys = ["Name", "Symbol", "Reserve"]
      ,allKeys = Object.keys( member )
  ;
  allKeys.forEach(function ( prop ) {
    if ( ignoreKeys.includes( prop ) ) {
      return;
    }

    var val = member[ prop ];
    if ( val instanceof Object ) {
      return;
    }

    logger.log( prop, "::", val);
  });

}

function confirmDeploy( member ) {
  console.log("\x1b[34m Do you Approve Deployment & Registration of UtilityToken? Options:\x1b[0m");
  console.log("\x1b[32m yes \x1b[0m\t" , "To Approve Deployment & Registration of UtilityToken");
  console.log("\x1b[31m no \x1b[0m\t" , "To disapprove");
  console.log("\x1b[33m exit \x1b[0m\t" , "To quit the program");
  return new Promise( (resolve, reject) => {
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '>'
    });
    rl.prompt();
    rl.on("line", (line) => {
      line = line.trim().toLowerCase();
      switch ( line ) {
        case "yes":
        case "y":
          rl.close();
          resolve( member );    
        break;
        case "no":
        case "n":
        case "skip":
          rl.close();
          resolve();    
        break;
        case "exit":
        case "bye":
          logger.log("Deployment aborted. Bye");
          process.exit(0);
        break;
        default:
          logger.error("Invalid Input. Supported Inputs: yes/no/exit");
      }
    });
  });
}

function deployUtilityToken( member ) {
  logger.step("Unlocking REGISTRAR, REGISTRAR_ADDRESS:", REGISTRAR_ADDRESS);

  const updateMemberInfo = new UpdateMemberInfo(member);

  return Geth.UtilityChain.eth.personal.unlockAccount( REGISTRAR_ADDRESS, REGISTRAR_KEY)
    .then(_ => {
      logger.win("Registrar Unlocked");
      logger.step("Deploying UtilityToken");
      return new UtilityToken(member.Reserve, member.ERC20)
          .deploy(member.Symbol, member.Name, member.Decimals, member.ChainId, REGISTRAR_ADDRESS);
    })
    .then(address => {
      logger.win("UtilityToken Deployed Successfully!");
      logger.info("Updating Utility Token Address");
      return updateMemberInfo.setMemberContractAddress(address);
    })
    .then( _ => {

      const FOUNDATION_ADDRESS = coreAddresses.getAddressForUser('foundation')
            ,contractAddress = coreAddresses.getAddressesForContract('staking')
            ,stakeContract = new StakeContract(FOUNDATION_ADDRESS, contractAddress)
      ;

      logger.step("Registering UtilityToken");

      return stakeContract.registerUtilityToken(member.Symbol, member.Name, member.Decimals, member.ConversionRate, member.ChainId, member.Reserve, member.ERC20 );

    })
    .then(txreceipt => {
      if ( !txreceipt instanceof Object || !txreceipt.value ) {
        throw("Failed to register UtilityToken");
      }
      logger.win("UtilityToken Registered Successfully");

      logger.info("UtilityToken Contract Address\x1b[34m", member.ERC20, logger.CONSOLE_RESET);
      logger.info("Fetching UUID of", member.Name);
      return new UtilityToken(member.Reserve, member.ERC20).uuid();
    })
    // .then(address => {
    //   logger.win("UtilityToken Deployed Successfully!");
    //   member.ERC20 = address;
    //   logger.step("Updating Config");
    //   logger.info("UtilityToken Contract Address\x1b[34m", member.ERC20, logger.CONSOLE_RESET);
    //   logger.info("Fetching UUID of", member.Name);
    //   return new UtilityToken(member.Reserve, member.ERC20).uuid();
    // })
    .then(uuid => {
        logger.info(member.Name, "UUID:" , uuid);
        updateMemberInfo.setMemberUUID(uuid);
    })
    .catch(err => {
        logger.error(member.Symbol, err.message||err);
        catchAndExit( err );
    });
}

async function deployUtilityTokenForAllMembers() {
  const Members = Config.Members;
  var len = Members.length
      ,member
  ;
  for(var i=0; i<len; i++ ) {
    member = Members[ i ];
    describeMember( member );
    if ( is_uc_main_net ){
      await confirmDeploy( member ).then( approvedMember =>{
        if ( approvedMember ) {
          return deployUtilityToken( approvedMember );  
        }
        logger.info("UtilityToken Deployment has been skipped");
      });
    } else {
      await deployUtilityToken( member );
    }
  }
  console.log("Done....");
}

(function () {
    validateUtilityChain()
    .then( deployUtilityTokenForAllMembers )
})();



