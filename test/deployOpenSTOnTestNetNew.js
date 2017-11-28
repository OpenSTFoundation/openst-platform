"use strict";

const rootPrefix = "..",
      FS = require('fs'),
      Path = require('path'),
      deployHelper = require(rootPrefix+'/tools/deploy/helper'),
      BigNumber = require('bignumber.js'),
      SimpleToken = require(rootPrefix+'/lib/simpleTokenContract'),
      web3RpcValueProvider = require(rootPrefix+'/lib/web3/providers/value_rpc'),
      web3RpcUtilityProvider = require(rootPrefix+'/lib/web3/providers/utility_rpc'),
      Config = require(process.argv[2] || rootPrefix+'/config.json'),
      populateEnvVars = require(rootPrefix+"/lib/populate_env_vars.js"),
      coreConstants = require(rootPrefix + '/config/core_constants'),
      coreAddresses = require(rootPrefix + '/config/core_addresses'),
      FOUNDATION = coreAddresses.getAddressForUser('foundation'),
      FOUNDATION_PASSPHRASE = coreAddresses.getPassphraseForUser('foundation'),
      REGISTRAR = coreAddresses.getAddressForUser('valueRegistrar'),
      REGISTRAR_KEY = coreAddresses.getPassphraseForUser('valueRegistrar'),
      DEPLOYER = coreAddresses.getAddressForUser('deployer'),
      DEPLOYER_KEY = coreAddresses.getPassphraseForUser('deployer')
  ;

// These addresses may change during the script. So, these should not be const.
var SIMPLETOKEN_CONTRACT = coreAddresses.getAddressForContract('simpleToken')
  ;


const CONSOLE_RESET = "\x1b[0m";
const ERR_PRE = "\x1b[31m ERROR ::"; //Error. (RED)
const INFO_PRE = "\x1b[33m  "; //Info (YELLOW)
const WIN_PRE = "\x1b[32m...ok"; //Success (GREEN)
const STEP_PRE = "======================================================\n\x1b[34mStep:"; //Step Description (BLUE)

const MIN_FUND = (new BigNumber( 10 )).toPower( 18 );
const _registrarName = "Registrar";
const _deployerName = "Deployer";
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

  return web3RpcValueProvider.eth.net.getId()
  .then( networkId => {
    if (networkId == 1) {
      logError( errMsg );
      catchAndExit();
    }
    logInfo( "ValueChain NetworkId: ", networkId );
    logWin( "ValueChain validated" );
  })
  .catch( reason =>  {
    //Inform user to add 'net' option to rpcapi.
    logError( "Could not verify network id of ValueChain" );
    logInfo( "When starting your geth node, make sure to include net and web3 in the --rpcapi argument, e.g. \n        --rpcapi \"net,eth,web3,personal\"");
    catchAndExit( reason );
  })
}

//Validate SimpleTokenFoundation Address.
function validateSimpleTokenFoundation() {
  logStep( "Validating SimpleTokenFoundation" );
  logInfo("SimpleTokenFoundation @", FOUNDATION );
  return web3RpcValueProvider.eth.getBalance(FOUNDATION)
  .catch( reason =>  {
    logError( "Invalid SimpleTokenFoundation address" );
    catchAndExit( reason );
  })
  .then( balance => {
    logInfo("ValueChain Balance of SimpleTokenFoundation =", balance);
    logInfo("Unlocking SimpleTokenFoundation on ValueChain");
    return web3RpcValueProvider.eth.personal.unlockAccount( FOUNDATION, FOUNDATION_PASSPHRASE );
  })
  .catch( reason =>  {
    logError( "Failed to unlock SimpleTokenFoundation" );
    catchAndExit( reason );
  })
  .then( _ => {
    logInfo("Fetching UtilityChain Balance of SimpleTokenFoundation");
    return web3RpcUtilityProvider.eth.getBalance(FOUNDATION)
    .catch( reason =>  {
      logError( "Invalid SimpleTokenFoundation address" );
      catchAndExit( reason );
    })
    .then( balance => {
      logInfo("UtilityChain Balance of SimpleTokenFoundation =", balance);
      logInfo("Unlocking SimpleTokenFoundation on UtilityChain");
      return web3RpcUtilityProvider.eth.personal.unlockAccount( FOUNDATION, FOUNDATION_PASSPHRASE );
    })
  })
  .then(_ => {
    logWin("SimpleTokenFoundation validated");
  });
}

//Validate SimpleTokenFoundation Address.
function validateAndFundUser(userName, userAddress, userKey) {
  logStep( "Validating",userName );
  logInfo(userName, "@", userAddress );
  logInfo("Fetching",userName,"balance on ValueChain");
  return web3RpcValueProvider.eth.getBalance( userAddress )
  .catch( reason =>  {
    logError( "Invalid",userName ,"address" );
    catchAndExit( reason );
  })
  .then(balance => {
    logInfo(userName, "balance =", balance);
    logInfo("Unlocking", userName, "on ValueChain");
    return web3RpcValueProvider.eth.personal.unlockAccount( userAddress, userKey );
  })
  .catch( reason =>  {
    logError( "Failed to unlock on ValueChain", userName );
    catchAndExit( reason );
  })
  .then( _ => {
    logInfo("Fetching",userName,"balance on UtilityChain");
    return web3RpcUtilityProvider.eth.getBalance( userAddress )
    .catch( reason =>  {
      logError( "Invalid",userName ,"address" );
      catchAndExit( reason );
    })
    .then(balance => {
      logInfo(userName, "balance =", balance);
      logInfo("Unlocking", userName, "on UtilityChain");
      return web3RpcUtilityProvider.eth.personal.unlockAccount( userAddress, userKey );
    })
    .catch( reason =>  {
      logError( "Failed to unlock on Utility Chain", userName );
      catchAndExit( reason );
    })
  })
  .then(_ =>{
    return fundAddressOnValueChain(userAddress, userName)
    .then(_ =>{
      return fundAddressOnUtilityChain(userAddress, userName);
    });
  });
}

function fundAddressOnValueChain( accountAddress, addressName ) {
  return fundAddress(web3RpcValueProvider,"ValueChain", accountAddress, addressName);
}
function fundAddressOnUtilityChain( accountAddress, addressName ) {
  return fundAddress(web3RpcUtilityProvider,"UtilityChain", accountAddress, addressName);
}

function fundAddress(Chain, chainName, accountAddress, addressName ) {
  logInfo("Unlock",addressName,"on",chainName);
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
        return Chain.eth.personal.unlockAccount(FOUNDATION, FOUNDATION_PASSPHRASE)
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
}

function initST() {
  if ( ST ) {
    return ST;
  }
  //Tell SimpleToken Class to use the new simpleTokenAddress
  SimpleToken.setContractAddress(SIMPLETOKEN_CONTRACT);

  //Create an instance of SimpleToken class.
  ST = new SimpleToken({
    from: FOUNDATION
  });

  return ST;
}

function setSimpleTokenRegistrar() {
  logStep( "Set SimpleToken Contract",_registrarName )

  initST();

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
      return;
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
          return; //<---- This is what goes into next call deploySimpleTokenContract.
        }
        logError( "Failed to set SimpleToken", _registrarName );
        catchAndExit();
      });
    });
  });
}

function deploySimpleTokenContract() {
  logStep("Deploying SimpleToken Contract on ValueChain");

  var contractName = 'simpleToken'
    ,contractAbi = coreAddresses.getAbiForContract(contractName)
    ,contractBin = coreAddresses.getBinForContract(contractName);

  return deployHelper.perform(
    contractName,
    web3RpcValueProvider,
    contractAbi,
    contractBin,
    'foundation'
  )
  .then(function(contractDeployResult) {
      logStep(contractDeployResult);
      logWin(contractName + " Contract deployed ");

      SIMPLETOKEN_CONTRACT = contractDeployResult.contractAddress;
  });
}


function updateConfig() {
  logStep("Updating Config");
  Config.ValueChain.SimpleToken = SIMPLETOKEN_CONTRACT; /* Allowed Usage */
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
      ost_stake_contract_address: ''
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
    .then( validateAndFundUser(_registrarName, REGISTRAR, REGISTRAR_KEY) )
    .then( validateAndFundUser(_deployerName, DEPLOYER, DEPLOYER_KEY) )
    .then( deploySimpleTokenContract )
    .then( setSimpleTokenRegistrar )
    .then( updateConfig )
    .then( _ => {
      console.log("✅ OpenST has been deployed successfully!");
      console.log("👊 Have Fun!");
      process.exit(1);
    })
    .catch( reason =>  {
      logError("Failed to populate open_st_env_vars.sh file!");
      catchAndExit( reason );
    });

})();
