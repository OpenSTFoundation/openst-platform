/**
 * Stake And Mint for Branded Token.
 * @module stake_and_mint/for_branded_token
 * @see stake_and_mint/for_branded_token
 */

"use strict";

const rootPrefix = '../..'
  , web3ValueRpcProvider = require(rootPrefix+'/lib/web3/providers/value_rpc')
  , web3UtilityWsProvider = require(rootPrefix+'/lib/web3/providers/utility_ws')
  , simpleTokenContractInteract = require(rootPrefix+'/lib/contract_interact/simpleToken')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , brandedTokenKlass = require(rootPrefix+'/lib/contract_interact/branded_token')
  , stakeAndMintUtil = require(rootPrefix + "/tools/stake_and_mint/util")
  , openSTValueContractName = 'openSTValue'
  , openSTValueContractAddress =  coreAddresses.getAddressForContract(openSTValueContractName)
  , openSTUtilityContractName = 'openSTUtility'
  , openSTUtilityContractABI = coreAddresses.getAbiForContract(openSTUtilityContractName)
  , openSTUtilityContractAddress =  coreAddresses.getAddressForContract(openSTUtilityContractName)
  , BigNumber = require('bignumber.js')
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  , Config = require(process.argv[2] || (rootPrefix + '/config.json') )
  , readline = require('readline')
  , UC = "UtilityChain"
  , VC = "ValueChain"
;

var brandedToken = null;

/**
 * convert simple token to display text.
 * @param {Bignumber} num - The number to be converted into display string.
 * @return {string} The st prime to display.
 */
const toDisplayST = function(num){
  var bigNum = new BigNumber( num )
    , fact = new BigNumber( 10 ).pow( 18 );

  return bigNum.dividedBy( fact ).toString( 10 ) + " ST";
};

/**
 * compare with ignoring case.
 * @param {string} compareWith - The string is to be compared with caller.
 * @return {string} The st prime to display.
 */
String.prototype.equalsIgnoreCase = function(compareWith){
  var _self = this.toLowerCase()
    , _compareWith = String( compareWith ).toLowerCase();

  return _self == _compareWith;
};

/**
 * Describe chain details.
 * @param {string} chainType - Type of chain
 * @param {string} web3Provider - url of web3 provider.
 */
const describeChain = function(chainType, web3Provider) {
  return web3Provider.eth.net.getId()
    .then(function(networkId){
        logger.info( chainType, "NetworkId: ", networkId );
        logger.info( VC, "HttpProvider.host: ", web3Provider.currentProvider.host );
      }
    )
};

/** Describe Member details. */
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

const getMemberSTBalance = function(member){
  return simpleTokenContractInteract.balanceOf( member.Reserve )
    .then( function(result){
      const memberBalance = result.data['balance'];
      logger.info(member.Name, "has", toDisplayST(memberBalance) );
      return new BigNumber(memberBalance);
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
      const bigNumStakeAmount = new BigNumber(line);
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

(function () {
  var selectedMember = null
    , toStakeAmount  = null
    , _passphrase = null
  ;

  logger.step("Validate", VC);

  describeChain(VC, web3ValueRpcProvider)
    .then(function(){
      logger.win(VC, "Validated");
      logger.step("Validate", UC);
      return describeChain(UC, web3UtilityWsProvider);
    })
    .then(function() {
      logger.win(UC, "Validated");
      return listAllMembers();
    })
    .then(function(member){
      logger.step("Confirm Member");
      return (confirmMember( member ) )
    })
    .then( function(member){
      selectedMember = member;

      brandedToken = new brandedTokenKlass(selectedMember);

      logger.step("Get Member ST Balance");
      return getMemberSTBalance( selectedMember );
    })
    .then(askStakingAmount)
    .then(function(bigNumStakeAmount){
      logger.step("Validate Stake Contract");
      toStakeAmount = bigNumStakeAmount;
      return getPassphrase( selectedMember );
    })
    .then( function(passphrase) {
      logger.win("Member Reserve unlocked on", VC);
      _passphrase = passphrase;

      return stakeAndMintUtil(
        selectedMember.Reserve,
        _passphrase,
        selectedMember.Reserve,
        toStakeAmount,
        brandedToken
      );
    })
    .then(function () {
      logger.win("Yoo.. Have Fun!!");
      process.exit(0);
    })
    .catch(function(reason){
      _passphrase = null;
      if ( reason && reason.message ){
        logger.error( reason.message );
      }
      reason && console.log( reason );
      process.exit(1);
    })
  ;
  _passphrase = null;
})();