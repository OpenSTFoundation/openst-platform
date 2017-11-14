const FS = require('fs');
const Path = require('path');
const BigNumber = require('bignumber.js');

const SimpleToken = require('../lib/simpleTokenContract');
const StakeContract = require('../lib/stakeContract');
const Geth = require("../lib/geth");

const SimpleTokenJson = require("../contracts/SimpleToken.json");
const Config = require(process.argv[2] || '../config.json');

const CONSOLE_RESET = "\x1b[0m";
const ERR_PRE = "\x1b[31m ERROR ::"; //Error. (RED)
const INFO_PRE = "\x1b[33m  "; //Info (YELLOW)
const WIN_PRE = "\x1b[32m...ok"; //Success (GREEN)
const STEP_PRE = "======================================================\n\x1b[34mStep:"; //Step Description (BLUE)

const MIN_FUND = (new BigNumber( 10 )).toPower( 18 );
const _registrarName = "Registrar";
const _registrarAddress = Config.ValueChain.Admin;
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
  logInfo("SimpleTokenFoundation @", Config.SimpleTokenFoundation );
  return Geth.ValueChain.eth.getBalance(Config.SimpleTokenFoundation)
  .catch( reason =>  {
    logError( "Invalid SimpleTokenFoundation address" );
    catchAndExit( reason );
  })
  .then( balance => {
    logInfo("ValueChain Balance of SimpleTokenFoundation =", balance);
    logInfo("Unlocking SimpleTokenFoundation on ValueChain");
    return Geth.ValueChain.eth.personal.unlockAccount( Config.SimpleTokenFoundation );
  })
  .catch( reason =>  {
    logError( "Failed to unlock SimpleTokenFoundation" );
    catchAndExit( reason );
  })
  .then( _ => {
    logInfo("Fetching UtilityChain Balance of SimpleTokenFoundation");
    return Geth.UtilityChain.eth.getBalance(Config.SimpleTokenFoundation)
    .catch( reason =>  {
      logError( "Invalid SimpleTokenFoundation address" );
      catchAndExit( reason );
    })
    .then( balance => {
      logInfo("UtilityChain Balance of SimpleTokenFoundation =", balance);
      logInfo("Unlocking SimpleTokenFoundation on UtilityChain");
      return Geth.UtilityChain.eth.personal.unlockAccount( Config.SimpleTokenFoundation );
    })
  })
  .then(_ => {
    logWin("SimpleTokenFoundation validated");
  });
}

//Validate SimpleTokenFoundation Address.
function validateRegistrar() {
  logStep( "Validating",_registrarName );
  logInfo(_registrarName, "@", _registrarAddress );
  logInfo("Fetching",_registrarName,"balance on ValueChain");
  return Geth.ValueChain.eth.getBalance( _registrarAddress )
    .catch( reason =>  {
      logError( "Invalid",_registrarName ,"address" );
      catchAndExit( reason );
    })
    .then(balance => {
      logInfo(_registrarName, "balance =", balance);
      logInfo("Unlocking", _registrarName, "on ValueChain");
      return Geth.ValueChain.eth.personal.unlockAccount( _registrarAddress );
    })
    .catch( reason =>  {
      logError( "Failed to unlock", _registrarName );
      catchAndExit( reason );
    })
    .then( _ => {
      logInfo("Fetching",_registrarName,"balance on UtilityChain");
      return Geth.UtilityChain.eth.getBalance( _registrarAddress )
      .catch( reason =>  {
        logError( "Invalid",_registrarName ,"address" );
        catchAndExit( reason );
      })
      .then(balance => {
        logInfo(_registrarName, "balance =", balance);
        logInfo("Unlocking", _registrarName, "on UtilityChain");
        return Geth.ValueChain.eth.personal.unlockAccount( _registrarAddress );
      })
      .catch( reason =>  {
        logError( "Failed to unlock", _registrarName );
        catchAndExit( reason );
      })
    })
    .then(_ =>{
      return fundAddressOnValueChain(_registrarAddress, _registrarName)
      .then(_ =>{
        return fundAddressOnUtilityChain(_registrarAddress, _registrarName);
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
    from: Config.SimpleTokenFoundation
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
        ,newAddress = String( _registrarAddress ).toLowerCase()
    ;
    if ( existingAddress === newAddress ) {
      logWin("SimpleToken", _registrarName, " address set");
      return deployMeta;
    }
    logInfo("Setting", _registrarName ,"Address to", _registrarAddress);
    return ST.methods.setAdminAddress( _registrarAddress ).send({from: Config.SimpleTokenFoundation })
    .catch( reason =>  {
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
            ,newAddress = String( _registrarAddress ).toLowerCase()
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
    Config.SimpleTokenFoundation,
    SimpleTokenJson.contracts['SimpleToken.sol:SimpleToken'],
    Config.ValueChain.SimpleToken
  )
  .catch( reason =>  {
    logError("Failed to deploy SimpleToken Contract on ValueChain");
    catchAndExit( reason );
  })
  .then( simpleToken => {
    logInfo("SimpleToken Contract Deployed @", simpleToken);
    var stakeContractAddress = 0x0;
    if (simpleToken === Config.ValueChain.SimpleToken) { 
      stakeContractAddress = Config.ValueChain.Stake;
    } else {
      logInfo("Updated SimpleToken Address in Config");
      Config.ValueChain.SimpleToken = simpleToken;
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

  return new StakeContract(Config.SimpleTokenFoundation, stakeContractAddress)
  .deploy(simpleTokenAddress)
  .catch( reason =>  {
    logError("Failed to deploy Stake Contract on ValueChain");
    catchAndExit( reason );
  })
  .then(stake => {
    logInfo("Stake Contract Deployed @", stake);

    if (stake !== Config.ValueChain.Stake) { 
      logInfo("Updated Stake Address in Config");
      Config.ValueChain.Stake = stake;
    }

    logWin("Stake Contract deployed");
    return stake;
  })
}

function finalizeSimpleTokenContract( deployMeta ) {
  logStep("Finalize SimpleTokenContract");

  initST( deployMeta )

  logInfo("Unlocking", _registrarName);
  return Geth.ValueChain.eth.personal.unlockAccount( _registrarAddress )
  .then( _ => {
    return ST.methods.finalize().send({from: _registrarAddress})
    .then( receipt => {
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
    return fundAddressOnValueChain(member.Reserve, member.Name)
      .then(_ =>{
        return fundAddressOnUtilityChain(member.Reserve, member.Name);
      });
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
          return Chain.eth.personal.unlockAccount(Config.SimpleTokenFoundation)
          .catch( reason =>  {
            logError("Failed to deploy unlockAccount SimpleTokenFoundation on", chainName);
            catchAndExit( reason );
          })
          .then(_ => {
            //Transfer the funds.
            return Chain.eth.sendTransaction({
              from: Config.SimpleTokenFoundation, 
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
