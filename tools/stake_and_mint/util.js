"use strict";

const rootPrefix = '../..'
  , web3ValueRpcProvider = require(rootPrefix+'/lib/web3/providers/value_rpc')
  , web3UtilityWsProvider = require(rootPrefix+'/lib/web3/providers/utility_ws')
  , eventsFormatter = require(rootPrefix+'/lib/web3/events/formatter.js')
  , simpleTokenContractInteract = require(rootPrefix+'/lib/contract_interact/simpleToken')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , brandedTokenKlass = require(rootPrefix+'/lib/contract_interact/branded_token')
  , openSTValueContractName = 'openSTValue'
  , openSTValueContractAddress =  coreAddresses.getAddressForContract(openSTValueContractName)
  , openSTValueContractInteractKlass = require(rootPrefix+'/lib/contract_interact/openst_value')
  , openSTValueContractInteract = new openSTValueContractInteractKlass()
  , openSTUtilityContractName = 'openSTUtility'
  , openSTUtilityContractABI = coreAddresses.getAbiForContract(openSTUtilityContractName)
  , openSTUtilityContractAddress =  coreAddresses.getAddressForContract(openSTUtilityContractName)
  , openSTUtilityContractInteractKlass = require(rootPrefix+'/lib/contract_interact/openst_utility')
  , openSTUtilityContractInteract = new openSTUtilityContractInteractKlass()
  , BigNumber = require('bignumber.js')
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  , Config = require(process.argv[2] || (rootPrefix + '/config.json') )
  , readline = require('readline')
  , UC = "UtilityChain"
  , VC = "ValueChain"
  ;

var brandedToken = null;

const toWeiST = function(amt){
  return new BigNumber( 10 ).pow( 18 ).mul( amt );
};

const toDisplayST = function(num){
  var bigNum = new BigNumber( num )
    , fact = new BigNumber( 10 ).pow( 18 );

  return bigNum.dividedBy( fact ).toString( 10 ) + " ST";
};

String.prototype.equalsIgnoreCase = function(compareWith){
  var _self = this.toLowerCase()
    , _compareWith = String( compareWith ).toLowerCase();

  return _self == _compareWith;
};

const describeChain = function(chainType, web3Provider) {
  return web3Provider.eth.net.getId()
    .then(function(networkId){
      logger.info( chainType, "NetworkId: ", networkId );
      logger.info( VC, "HttpProvider.host: ", web3Provider.currentProvider.host );
    }
  )
};

const describeMember = function(member) {
  logger.step("Please Confirm these details.");
  logger.log("Name ::", member.Name);
  logger.log("Symbol ::", member.Symbol);
  logger.log("Reserve ::\x1b[31m", member.Reserve, logger.CONSOLE_RESET);

  var ignoreKeys = ["Name", "Symbol", "Reserve"]
    , allKeys = Object.keys( member )
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
};

const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '>'
});

const listAllMembers = function() {
  console.log("\x1b[34m Welcome to Staking And Minting Tool \x1b[0m");
  logger.step("Please choose member to fund.");

  //List all available members.
  for( var i =0; i < Config.Members.length; i++  ) {
    var member = Config.Members[ i ];
    console.log( i+1, " for ", member.Name, "(", member.Symbol ,")"  );
  }

  return new Promise(function(resolve, reject) {
    readlineInterface.prompt();
    const rlCallback = function(line){
      console.log("listAllMembers :: line", line);
      line = line.trim().toLowerCase();
      switch ( line ) {
        case "exit":
        case "bye":
          logger.log("Staking Aborted. Bye");
          process.exit(0);
        break;
      }
      var memberIndex = Number( line ) - 1;
      console.log("Choosing Member : ", memberIndex);
      if ( isNaN( memberIndex ) || memberIndex >= Config.Members.length ) {
        console.log("\n");
        logger.error("Invalid Option. Please try again.");
        console.log("\n");
        return;
      }
      console.log( rlCallback );
      readlineInterface.removeListener("line", rlCallback);
      const member = Config.Members[ memberIndex ];
      resolve( member );
    };
    readlineInterface.on("line", rlCallback);
  });
};

const confirmMember = function(member) {
  describeMember( member );
  console.log("\x1b[34m Are you sure you would like to continue with Staking And Minting ? Options:\x1b[0m");
  console.log("\x1b[32m yes \x1b[0m\t" , "To continue with Staking And Minting");
  console.log("\x1b[31m no \x1b[0m\t" , "To quit the program");
  return new Promise( function(resolve, reject) {
    readlineInterface.prompt();
    const rlCallback = function(line) {
      console.log("confirmMember :: readlineInterface :: line", line);
      line = line.trim().toLowerCase();
      switch ( line ) {
        case "yes":
        case "y":
          readlineInterface.removeListener("line", rlCallback);
          resolve( member );
        break;
        case "no":
        case "n":
        case "exit":
        case "bye":
          logger.log("Staking Aborted. Bye");
          process.exit(0);
        break;
        default:
          logger.error("Invalid Input. Supported Inputs: yes/no/exit");
      }
    };
    readlineInterface.on("line", rlCallback);
  });
};

const getSTBalance = function( address ){
  return simpleTokenContractInteract.balanceOf( address )
  .then( function(result){
    const stBalance = result.data['balance'];
    logger.info("Address", address, "has", toDisplayST(stBalance) );
    return new BigNumber(stBalance);
  })
};

const askStakingAmount = function(bigNumBalance) {
  return new Promise( function(resolve, reject) {
    console.log("Please mention the Simple Tokens to Assign.");
    readlineInterface.prompt();
    const rlCallback = function(line) {
      console.log("askStakingAmount :: readlineInterface :: line", line);
      line = line.trim().toLowerCase();

      switch(line) {
        case "exit":
        case "bye":
          logger.log("Staking Aborted. Bye");
          process.exit(0);
        break;
      }

      const amt = Number(line);
      if (isNaN(amt)) {
        logger.error("amount is not a number. amount:", line);
        return;
      }
      const bigNumStakeAmount = toWeiST(line);
      logger.log("bigNumStakeAmount" , bigNumStakeAmount);
      if ( bigNumStakeAmount.cmp( bigNumBalance ) > 0 ) {
        logger.error("Member does not have sufficient SimpleTokens to stake " + toDisplayST(bigNumStakeAmount) );
        return;
      }
      readlineInterface.removeListener("line", rlCallback);
      resolve( bigNumStakeAmount );
    };
    readlineInterface.on("line", rlCallback);
  });
};

const getPassphrase = function(selectedMember){
  const hideConsoleString = "\x1b[8m";
  const resetConsoleString = "\x1b[0m";
  logger.step("Please provide member reserve passphrase.");
  return new Promise( function(resolve, reject) {
    readlineInterface.setPrompt("Passphrase:" + hideConsoleString);
    readlineInterface.prompt();
    const rlCallback = function(passphrase) {
      logger.step(resetConsoleString, "Unlocking Member Reserve on", VC);
      web3ValueRpcProvider.eth.personal.unlockAccount(selectedMember.Reserve, passphrase)
      .then(function() {
        logger.win("Member Reserve unlocked on", VC);
        readlineInterface.removeListener("line", rlCallback);
        resolve( passphrase );
      })
      .catch( function(reason) {
        logger.error("Failed to unlock reserve.");
        logger.error(reason.message);
        logger.step("Please provide correct member reserve passphrase." , hideConsoleString);
      });
    };
    readlineInterface.on("line", rlCallback);
  });
};

const checkAllowanceAndApproveIfNeeded = function(stakerAddress, passphrase, toStakeAmount) {
  return simpleTokenContractInteract.allowance(stakerAddress, openSTValueContractAddress)
    .then( function(result) {
      const allowance = result.data.remaining
        , bigNumAllowance = new BigNumber( allowance )
        , needsApproval = (bigNumAllowance != toStakeAmount);

      logger.info("Staker Allowance:", toDisplayST(allowance) );

      if (needsApproval){
        if ( bigNumAllowance != 0 ) {
          logger.info("Resetting Allowance to 0");
          //Reset allowance
          return simpleTokenContractInteract.approve(stakerAddress, passphrase, openSTValueContractAddress, 0)
              .then( function() {
                logger.info("Current Allowance has been set to 0");
                return needsApproval;
              });
        }
      }
      return needsApproval;
    })
    .then( function(needsApproval) {
      if ( !needsApproval ) {
        return true;
      }
      logger.info("Approving openSTValue contract with " , toDisplayST(toStakeAmount));
      return simpleTokenContractInteract.approve(stakerAddress, passphrase, openSTValueContractAddress, toStakeAmount);
    })
    .then( function(){
      return simpleTokenContractInteract.allowance(stakerAddress, openSTValueContractAddress)
        .then( function(result) {
          const allowance = result.data.remaining;
          logger.info("Current Allowance:", allowance);
        });
    });
};

function listenToUtilityToken(stakingIntentHash){

  return new Promise( function(onResolve, onReject){

    const utilityTokenContract = new web3UtilityWsProvider.eth.Contract(
      openSTUtilityContractABI,
      openSTUtilityContractAddress
    );

    utilityTokenContract.setProvider(web3UtilityWsProvider.currentProvider);
    utilityTokenContract.events.StakingIntentConfirmed({})
      .on('error', function(errorObj){
        logger.error("Could not Subscribe to StakingIntentConfirmed");
        onReject();
      })
      .on('data', function(eventObj) {
        logger.info("data :: StakingIntentConfirmed");
        const returnValues = eventObj.returnValues;
        if ( returnValues ) {
          const _stakingIntentHash = returnValues._stakingIntentHash;

          // We need to perform action only if the staking intent hash matches.
          // Need this check this as there might be multiple stakes(by different member company) on same Utility chain.

          if ( stakingIntentHash.equalsIgnoreCase( _stakingIntentHash ) ) {
            onResolve( eventObj );
          }
        }
      });
  });
}

module.exports = function (stakerAddress, stakerPassphrase, beneficiary, toStakeAmount, utilityTokenInterfaceContract) {
  toStakeAmount = toWeiST( toStakeAmount );
  var selectedMember = null
    , eventDataValues = null
  ;

  logger.step("Get ST of Staker");

  return getSTBalance( stakerAddress )
    .then(function(bigSTBalance){
      if ( bigSTBalance.lessThan( toStakeAmount ) ) {
        logger.error("Insufficient ST Balance. Available ST Balance: ", bigSTBalance.toString( 10 ), "Amount to stake :", toStakeAmount.toString(10) );
        return Promise.reject( "Insufficient ST Balance" );
      }
      logger.step("Validate Current Allowance");
      return checkAllowanceAndApproveIfNeeded(stakerAddress, stakerPassphrase, toStakeAmount) ;
    })
    .then( _ => {
      return utilityTokenInterfaceContract.getUuid().then( response => {
        console.log( JSON.stringify( response ) );
        return response.data.uuid;
      });
    })
    .then( function( uuid ) {
      logger.win("Staker Current Allowance validated");

      logger.step("Staking ", toDisplayST( toStakeAmount ) );
      console.log(
        stakerAddress, "\n",
        stakerPassphrase,"\n",
        uuid,"\n",
        toStakeAmount.toString( 10 ),"\n",
        beneficiary
      );

      return openSTValueContractInteract.stake(
        stakerAddress,
        stakerPassphrase,
        uuid,
        toStakeAmount.toString( 10 ),
        beneficiary
      );
    })
    .then( async function(result) {
      if (result.isFailure()){
        console.log( "Staking resulted in error: \n" );
        console.log(result);
        return Promise.reject( result );
      }

      const formattedTransactionReceipt = result.data.formattedTransactionReceipt
        , rawTxReceipt = result.data.rawTransactionReceipt;

      var eventName = 'StakingIntentDeclared'
        , formattedEventData = await eventsFormatter.perform(formattedTransactionReceipt);

      eventDataValues = formattedEventData[eventName];

      if (!eventDataValues){
        console.log( "Staking was not completed correctly: StakingIntentDeclared event didn't found in events data: \n");
        console.log("rawTxReceipt is:\n");
        console.log(rawTxReceipt);
        console.log("\n\n formattedTransactionReceipt is:\n");
        console.log(formattedTransactionReceipt);
        return Promise.reject( "Staking was not completed correctly: StakingIntentDeclared event didn't found in events data" );
      }

      logger.win("Staked", toDisplayST( toStakeAmount ) );

      logger.info("eventDataValues:");
      logger.info(eventDataValues);

      return eventDataValues;
    })
    .then(function(eventDataValues){
      logger.step("Waiting for Staking Intent Confirmation ...");
      return listenToUtilityToken(eventDataValues['_stakingIntentHash']);
    })
    .then(function(eventObj){
      logger.win("Received StakingIntentConfirmed");
      logger.step("starting processStaking on ValueChain");
      return openSTValueContractInteract.processStaking(
        stakerAddress,
        stakerPassphrase,
        eventDataValues['_stakingIntentHash']
      );
    })
    .then(function(){
      logger.win("Completed processing Stake");
      logger.step("Process Minting");
      return openSTUtilityContractInteract.processMinting(
        stakerAddress,
        stakerPassphrase,
        eventDataValues['_stakingIntentHash']
      )
    })
    .then(function (processMintingResult) {
      logger.win("Minting Completed!");
      logger.win("Beneficiary Claiming Now!");
      return utilityTokenInterfaceContract.claim(
        stakerAddress,
        stakerPassphrase,
        beneficiary
      );
    })
    .then(function(claimResult){
      logger.log("Claiming Receipt below: ");
      logger.log(JSON.stringify(claimResult));
      logger.win("Claiming Completed by beneficiary!");
    })
    .then(async function () {
      console.log("Beneficiary Address: "+ beneficiary);
      console.log("Beneficiary Balance: ");
      console.log( await utilityTokenInterfaceContract.getBalanceOf( beneficiary ) );
      return Promise.resolve({success: true});
    })
    .catch(function(reason){
      stakerPassphrase = null;
      if ( reason && reason.message ){
        logger.error( reason.message );
      }
      reason && console.log( reason );
      return Promise.reject({success: true, reason: reason});
    })
  ;
  stakerPassphrase = null;
};

