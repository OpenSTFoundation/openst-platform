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
const FS = require('fs');
const Path = require('path');
const BigNumber = require('bignumber.js');

const SimpleToken = require('../lib/simpleTokenContract');
const UtilityToken = require('../lib/bt');
const StakeContract = require('../lib/stakeContract');
const Geth = require("../lib/geth");
const logger = require("./helpers/CustomConsoleLogger");
const Config = require(process.argv[2] || '../config.json');

const VC = "ValueChain";
const UC = "UtilityChain";
const UC_MAIN_NET_ID = 1410; //To Do: Read from Config
const is_uc_main_net = true;

//Method to display the exception reason and exit.
function catchAndExit( reason ) {
  reason && console.log( reason );
  process.exit(1);
}


//Method to validate UtilityChain. Ensures no one 'accidentally' deploys on Mainnet.
function validateUtilityChain() {
  logger.step( "Validating", UC );
  return Geth.UtilityChain.eth.net.getId(function (error, result) {
    //Ensure UtilityChain is not on MainNet. networkId should NOT be UC_MAIN_NET_ID.
    if ( result == UC_MAIN_NET_ID ) {
        logger.warn(UC, "is connected to networkId", UC_MAIN_NET_ID ,"(SimpleToken Mainnet)");
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

function validateMember( member ) {
  return 
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

const readline = require('readline');
function confirmDeploy( member ) {
  return new Promise( (resolve, reject) => {
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\x1b[34mAre you sure you want to continue with deployment ? (yes/no) >\x1b[0m'
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
        case "skip":
          rl.close();
          resolve();    
        break;
        case "no":
        case "n":
        case "exit":
        case "bye":
          logger.log("Deployment aborted");
          process.exit(0);
        break;
        default:
          logger.error("Invalid Input. Supported Inputs: yes/no/exit");
      }
    });
  });
}

function deployUtilityToken( member ) {
  logger.step("Deploying UtilityToken Contract for ", member.Name);
  return getPassphrase( member )
    .then(passphrase =>{
      return unlockMember(member, passphrase);
    })
    .then(_ => {
      logger.step("Deploying UtilityToken");
      return new UtilityToken(member.Reserve, member.ERC20)
          .deploy(member.Symbol, member.Name, member.Decimals, member.ChainId);
    })
    .then(address => {
      logger.win("UtilityToken Deployed Successfully!");
      
      member.ERC20 = address;

      logger.step("Updating Config");
      logger.info("UtilityToken Contract Address\x1b[34m", address,logger.CONSOLE_RESET);
      logger.info("Fetching UUID of", member.Name);
      return new UtilityToken(member.Reserve, address).uuid();
    })
    .then(uuid => {
        logger.info(member.Name, "UUID:" , uuid);
        member.UUID = uuid;
    })
    .catch(err => {
        logger.error(member.Symbol, err.message||err);
        catchAndExit( err );
    })
    .then(_ =>{
      
      const json = JSON.stringify(Config, null, 4);
      const configFilePath  = Path.join(__dirname, '/../config.json');

      logger.info("Updating Config File. Writing into:" , configFilePath);
      return new Promise( (resolve,reject) => {
        FS.writeFile(configFilePath, json, err => err ? reject(err) : resolve() );
      })          
      .catch( reason =>  {
        logError("Failed to update Config file!");
        catchAndExit( reason );
      })
      .then( _ => {
        logger.win("Config updated.");
      });
    });
}

function unlockMember( member, passphrase ) {
  passphrase = passphrase || "";
  logger.step("Unlocking",member.Name,"on UtilityChain");
  return Geth.UtilityChain.eth.personal.unlockAccount(member.Reserve, passphrase)
    .catch(reason => {
      logger.error("Failed to unlock account");
      catchAndExit( reason );
    })
    .then(_ => {
      logger.win(member.Name, "successfully unlocked");
    })
  ;
}

function getPassphrase( member ) {
  return new Promise( (resolve, reject) => {
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\x1b[34m Enter Passphrase:\x1b[0m\x1b[8m'
    });
    rl.prompt();
    rl.on("line", ( passphrase ) => {
      console.log("\x1b[0m");
      resolve( passphrase );
      rl.close();
    });

  });
}

function deployUtilityTokenForAllMembers() {
  Config.Members.map(async function (member) {
    describeMember( member );
    if ( is_uc_main_net ){
      await confirmDeploy( member ).then(member =>{
        if ( member ) {
          return deployUtilityToken( member );  
        }
        logger.info("UtilityToken Deployment of", member.Name, "has been skipped");
      });
    } else {
      await deployUtilityToken( member );
    }
  });
}

(function () {
    validateUtilityChain()
    .then( deployUtilityTokenForAllMembers )
})();



