"use strict";
/*
 *   Contract Deployment Script for local setup. 
 * * Author: Rachin Kapoor
 * * Date: 12/10/2017
 * * Description: This script deploys SimpleToken & Staking Contracts, funds members & other actors.
 * * WARNING: Do not deploy on MainNet.  
 * * Reviewed by:
 * * 
 */

const FS = require('fs');
const Path = require('path');
const BigNumber = require('bignumber.js');

const SimpleToken = require('../lib/simpleTokenContract');
const StakeContract = require('../lib/stakeContract');
const Geth = require("../lib/geth");

const SimpleTokenJson = require("../contracts/SimpleToken.json")
     , Config = require(process.argv[2] || '../config.json')
     , populateEnvVars = require("../lib/populate_env_vars.js");

const coreConstants = require('../config/core_constants')
     ,coreAddresses = require('../config/core_addresses')
      ,FOUNDATION = coreAddresses.getAddressForUser('foundation')
      ,REGISTRAR = coreAddresses.getAddressForUser('valueRegistrar')
      ,REGISTRAR_KEY = coreAddresses.getPassphraseForUser('valueRegistrar')
;

// These addresses may change during the script. So, these should not be const.
var SIMPLETOKEN_CONTRACT = coreAddresses.getAddressForContract('simpleToken')
    ,STAKE_CONTRACT = coreAddresses.getAddressesForContract('staking')
;


const CONSOLE_RESET = "\x1b[0m";
const ERR_PRE = "\x1b[31m ERROR ::"; //Error. (RED)
const INFO_PRE = "\x1b[33m  "; //Info (YELLOW)
const WIN_PRE = "\x1b[32m...ok"; //Success (GREEN)
const STEP_PRE = "======================================================\n\x1b[34mStep:"; //Step Description (BLUE)

const MIN_FUND = (new BigNumber( 10 )).toPower( 18 );
const _registrarName = "Registrar";
var ST = null;

//Method to Log Step Description
function logStep() {
  var args = [STEP_PRE];
  args = args.concat(Array.prototype.slice.call(arguments));
  args.push( CONSOLE_RESET );
  console.log.apply(console, args);
}

//Method to Log Information
function logInfo() {
  var args = [INFO_PRE];
  args = args.concat(Array.prototype.slice.call(arguments));
  args.push( CONSOLE_RESET );
  console.log.apply(console, args);
}

//Method to Log Error.
function logError() {
  var args = [ERR_PRE];
  args = args.concat(Array.prototype.slice.call(arguments));
  args.push( CONSOLE_RESET );
  console.log.apply(console, args);
}

//Method to Log Success/Win.
function logWin() {
  var args = [WIN_PRE];
  args = args.concat(Array.prototype.slice.call(arguments));
  args.push( CONSOLE_RESET );
  console.log.apply(console, args);
}

//Method to display the exception reason and exit.
function catchAndExit( reason ) {
  reason && console.log( reason );
  process.exit(1);
}

String.prototype.equalsIgnoreCase = function ( compareWith ) {
    var _self = this.toLowerCase();
    var _compareWith = String( compareWith ).toLowerCase();
    return _self == _compareWith;
}

//Method to validate ValueChain. Ensures no one 'accidentally' deploys on Mainnet.
function validateValueChain() {
  logStep( "Validating Value Chain" );
  const errMsg = "Can not deploy OpenST contracts on MainNet.";

  return Geth.ValueChain.eth.net.getId(function (error, result) {
    //Ensure ValueChain is not on MainNet. networkId should NOT be 1.
    if ( result == 1 ) {
        logError( errMsg );
        catchAndExit();
    }
  })
  .catch( reason =>  {
    //Inform user to add 'net' option to rpcapi.
    logError( "Could not verify network id of ValueChain" );
    logInfo( "When starting your geth node, make sure to include net and web3 in the --rpcapi argument, e.g. \n        --rpcapi \"net,eth,web3,personal\"");
    catchAndExit( reason );
  })
  .then( networkId => {
    logInfo( "ValueChain NetworkId: ", networkId );
    logInfo( "ValueChain HttpProvider.host: ", Geth.ValueChain.currentProvider.host );
    logWin( "ValueChain validated" );
  });
}

//Validate SimpleTokenFoundation Address.
function validateSimpleTokenFoundation() {
  logStep( "Validating SimpleTokenFoundation" );
  logInfo("SimpleTokenFoundation @", FOUNDATION );
  return Geth.ValueChain.eth.getBalance(FOUNDATION)
  .catch( reason =>  {
    logError( "Invalid SimpleTokenFoundation address" );
    catchAndExit( reason );
  })
  .then( balance => {
    logInfo("ValueChain Balance of SimpleTokenFoundation =", balance);
    logInfo("Unlocking SimpleTokenFoundation on ValueChain");
    return Geth.ValueChain.eth.personal.unlockAccount( FOUNDATION );
  })
  .catch( reason =>  {
    logError( "Failed to unlock SimpleTokenFoundation" );
    catchAndExit( reason );
  })
  .then( _ => {
    logInfo("Fetching UtilityChain Balance of SimpleTokenFoundation");
    return Geth.UtilityChain.eth.getBalance(FOUNDATION)
    .catch( reason =>  {
      logError( "Invalid SimpleTokenFoundation address" );
      catchAndExit( reason );
    })
    .then( balance => {
      logInfo("UtilityChain Balance of SimpleTokenFoundation =", balance);
      logInfo("Unlocking SimpleTokenFoundation on UtilityChain");
      return Geth.UtilityChain.eth.personal.unlockAccount( FOUNDATION );
    })
  })
  .then(_ => {
    logWin("SimpleTokenFoundation validated");
  });
}

//Validate SimpleTokenFoundation Address.
function validateRegistrar() {
  logStep( "Validating",_registrarName );
  logInfo(_registrarName, "@", REGISTRAR );
  logInfo("Fetching",_registrarName,"balance on ValueChain");
  return Geth.ValueChain.eth.getBalance( REGISTRAR )
    .catch( reason =>  {
      logError( "Invalid",_registrarName ,"address" );
      catchAndExit( reason );
    })
    .then(balance => {
      logInfo(_registrarName, "balance =", balance);
      logInfo("Unlocking", _registrarName, "on ValueChain");
      return Geth.ValueChain.eth.personal.unlockAccount( REGISTRAR, REGISTRAR_KEY );
    })
    .catch( reason =>  {
      logError( "Failed to unlock", _registrarName );
      catchAndExit( reason );
    })
    .then( _ => {
      logInfo("Fetching",_registrarName,"balance on UtilityChain");
      return Geth.UtilityChain.eth.getBalance( REGISTRAR )
      .catch( reason =>  {
        logError( "Invalid",_registrarName ,"address" );
        catchAndExit( reason );
      })
      .then(balance => {
        logInfo(_registrarName, "balance =", balance);
        logInfo("Unlocking", _registrarName, "on UtilityChain");
        return Geth.ValueChain.eth.personal.unlockAccount( REGISTRAR, REGISTRAR_KEY );
      })
      .catch( reason =>  {
        logError( "Failed to unlock", _registrarName );
        catchAndExit( reason );
      })
    })
    .then(_ =>{
      return fundAddressOnValueChain(REGISTRAR, _registrarName)
      .then(_ =>{
        return fundAddressOnUtilityChain(REGISTRAR, _registrarName);
      });
    });
}
function initST( deployMeta ) {
  if ( ST ) {
    return ST;
  }
  //Tell SimpleToken Class to use the new simpleTokenAddress
  SimpleToken.setContractAddress( deployMeta.simpleTokenAddress );

  //Create an instance of SimpleToken class.
  ST = new SimpleToken({
    from: FOUNDATION
  });
  return ST;
}
function setSimpleTokenRegistrar( deployMeta ) {
  logStep( "Set SimpleToken Contract",_registrarName )

  initST( deployMeta );

  //Check for existing Address.
  return ST.methods.adminAddress().call()
  .catch( reason =>  {
    logError("Failed to fetch", _registrarName, "Address");
    catchAndExit();
  })
  .then(existing_admin => {
    logInfo("Existing", _registrarName ,"Address", existing_admin);
    var existingAddress = String( existing_admin ).toLowerCase()
        ,newAddress = String( REGISTRAR ).toLowerCase()
    ;
    if ( existingAddress === newAddress ) {
      logWin("SimpleToken", _registrarName, " address set");
      return deployMeta;
    }
    logInfo("Setting", _registrarName ,"Address to", REGISTRAR);
    return ST.methods.setAdminAddress( REGISTRAR ).send({
        from: FOUNDATION,
        gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE
      }).catch( reason =>  {
      logError("Failed to set", _registrarName, "Address");
      catchAndExit();
    })
    .then(_ => {
      logInfo("Re-Verifying",_registrarName, "Address");
      //Verify Again.
      return ST.methods.adminAddress().call()
      .catch( reason =>  {
        logError("Failed to verify", _registrarName, "Address");
        catchAndExit();
      })
      .then(existing_admin => {
        var existingAddress = String( existing_admin ).toLowerCase()
            ,newAddress = String( REGISTRAR ).toLowerCase()
        ;
        if ( existingAddress === newAddress ) {
          logWin("SimpleToken", _registrarName, " address set");
          return deployMeta; //<---- This is what goes into next call deploySimpleTokenContract.
        }
        logError( "Failed to set SimpleToken", _registrarName );
        catchAndExit();
      });
    });
  });
}

function deploySimpleTokenContract() {
  logStep("Deploying SimpleToken Contract on ValueChain");

  return Geth.ValueChain.deployContract(
    FOUNDATION,
    SimpleTokenJson.contracts['SimpleToken.sol:SimpleToken'],
    SIMPLETOKEN_CONTRACT
  )
  .catch( reason =>  {
    logError("Failed to deploy SimpleToken Contract on ValueChain");
    catchAndExit( reason );
  })
  .then( simpleToken => {
    logInfo("SimpleToken Contract Deployed @", simpleToken);
    var stakeContractAddress = 0x0;
    if ( simpleToken === SIMPLETOKEN_CONTRACT ) { 
      stakeContractAddress = STAKE_CONTRACT;
    } else {
      logInfo("Updated SimpleToken Address in Config");
      SIMPLETOKEN_CONTRACT = simpleToken;
    }
    logWin("SimpleToken Contract deployed");

    return {
      simpleTokenAddress: simpleToken
      ,stakeContractAddress: stakeContractAddress
    };
  })
}

function deployStakeContract( deployMeta ) {
  logStep("Deploying Stake Contract on ValueChain.");

  const simpleTokenAddress    = deployMeta.simpleTokenAddress
        ,stakeContractAddress = deployMeta.stakeContractAddress
  ;

  stakeContractAddress && logInfo("Stake Contract Address :", stakeContractAddress);

  const stakeContract = new StakeContract(FOUNDATION, stakeContractAddress)
  return new StakeContract(FOUNDATION, stakeContractAddress).deploy(simpleTokenAddress)
  .catch( reason =>  {
    logError("Failed to deploy Stake Contract on ValueChain");
    catchAndExit( reason );
  })
  .then(stake => {
    logInfo("Stake Contract Deployed @", stake);

    if (stake !== STAKE_CONTRACT) { 
      logInfo("Updated Stake Address in Config");
      STAKE_CONTRACT = stake;
    }
    logInfo("Stake Contract deployed");
    logInfo("Setting Stake Contract Registrar Address");
    const stakeContract = new StakeContract(FOUNDATION, stake)
    return stakeContract._instance.methods.setAdminAddress( REGISTRAR ).send({
      from: FOUNDATION,
      gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE
    })
  })
  .then( _ =>{
    logWin("Stake Contract Admin Updated");
    return STAKE_CONTRACT;
  })
}

function finalizeSimpleTokenContract( deployMeta ) {
  logStep("Finalize SimpleTokenContract");

  initST( deployMeta )

  logInfo("Unlocking", _registrarName);
  return Geth.ValueChain.eth.personal.unlockAccount( REGISTRAR, REGISTRAR_KEY )
  .then( _ => {
    return ST.methods.finalize().send({
      from: REGISTRAR,
      gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE
    }).then( receipt => {
      if ( ("Finalized") in receipt.events ) {
        logWin("SimpleTokenContract Finalized");
        return deployMeta;
      } else {
        logError("Finalized event missing in receipt" );
        catchAndExit( JSON.stringify(receipt, null, 2) );
      }
    });
  });

}

function fundAllMembers() {
  logStep("Funding all Members");
  return Promise.all( Config.Members.map( fundMember ) );
}

function fundMember( member ) {
  const grantInST = new BigNumber( 100000 );
  const grant = new BigNumber(10).pow( 18 ).mul( grantInST ).toString( 10 );
  return fundAddressOnValueChain(member.Reserve, member.Name)
    .then(_ =>{
      return fundAddressOnUtilityChain(member.Reserve, member.Name);
    })
    .then(_ => {
      logStep("Grant", member.Name, "with" , grantInST.toString( 10 ), "ST");
      return ST.methods.transfer( member.Reserve, grant.toString( 10 ) ).send({
        from: FOUNDATION,
        gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE
      });
    })
    .then(_ => {
      logWin(member.Name, "has been granted with", grantInST.toString( 10 ), "ST");
    });
  ;
}
function fundAddress(Chain, chainName, accountAddress, addressName ) {
  logInfo("Unlock",addressName,"on",chainName);
  return Chain.eth.personal.unlockAccount(accountAddress)
  .then( _ => {
    logInfo("Fetch",addressName,"balance on",chainName);
    return Chain.eth.getBalance( accountAddress )
      .catch( reason =>  {
        logError("Failed to fund ", addressName);
        catchAndExit( reason );
      })
      .then(balance => {
        logInfo(addressName, "has", balance,"on",chainName);

        const bigBalance = new BigNumber( balance );
        //See how many funds are needed.
        const diff = MIN_FUND.minus( bigBalance );

        if ( diff.greaterThan( 0 ) ) {
          return Chain.eth.personal.unlockAccount(FOUNDATION)
          .catch( reason =>  {
            logError("Failed to deploy unlockAccount SimpleTokenFoundation on", chainName);
            catchAndExit( reason );
          })
          .then(_ => {
            //Transfer the funds.
            return Chain.eth.sendTransaction({
              from: FOUNDATION, 
              to: accountAddress, 
              value: diff.toString( 10 ) 
            })
            .catch( reason =>  {
              logError("Failed to transfer funds to ", addressName, "on", chainName);
              catchAndExit( reason );
            })
            .then( _ => {
              logWin(addressName,"has been transfered",diff.toString( 10 ),"on", chainName );
            });
          });
        } else {
          logWin(addressName,"has sufficient funds on", chainName);
        }
      });
    });
}
function fundAddressOnValueChain( accountAddress, addressName ) {
  return fundAddress(Geth.ValueChain,"ValueChain", accountAddress, addressName);
}
function fundAddressOnUtilityChain( accountAddress, addressName ) {
  return fundAddress(Geth.UtilityChain,"UtilityChain", accountAddress, addressName);
}


function updateConfig() {
  logStep("Updating Config");
  Config.ValueChain.SimpleToken = SIMPLETOKEN_CONTRACT; /* Allowed Usage */
  Config.ValueChain.Stake = STAKE_CONTRACT; /* Allowed Usage */
  const json = JSON.stringify(Config, null, 4);

  return new Promise( (resolve,reject) => {
    FS.writeFile(Path.join(__dirname, '/../config.json'), json, err => err ? reject(err) : resolve() );
  })
 .catch( reason =>  {
    logError("Failed to update Config file!");
    catchAndExit( reason );
  })
  .then( _ => {
    logWin("Config updated.");
  })
  .then (_ => {
    populateEnvVars.renderAndPopulate('contract', {
    ost_simpletoken_contract_address: SIMPLETOKEN_CONTRACT,
    ost_stake_contract_address: STAKE_CONTRACT
    });
  })
  .catch( reason =>  {
    logError("Failed to populate open_st_env_vars.sh file!");
    catchAndExit( reason );
  })
  .then( _ => {
    logWin("open_st_env_vars updated.");
  });
}

//Self Executing Function.
(function () {

  validateValueChain()
  .then( validateSimpleTokenFoundation )
  .then( validateRegistrar )
  .then( deploySimpleTokenContract )
  .then( setSimpleTokenRegistrar )
  .then( finalizeSimpleTokenContract )
  .then( deployStakeContract )
  .then( updateConfig )
  .then( fundAllMembers )
  .then( _ => {
    console.log("✅ OpenST has been deployed successfully!");
    console.log("👊 Have Fun!");
  });

})();
