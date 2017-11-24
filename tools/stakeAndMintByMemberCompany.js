"use strict";

const rootPrefix = '..'
  , web3ValueRpcProvider = require(rootPrefix+'/lib/web3/providers/value_rpc')
  , web3UtilityWsProvider = require(rootPrefix+'/lib/web3/providers/utility_ws')
  , simpleTokenContractInteract = require(rootPrefix+'/lib/contract_interact/simpleToken')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , openSTContractName = 'openSTValue'
  , openSTValueContractAddress =  coreAddresses.getAddressForContract(openSTContractName)
  , openSTValueContractInteractKlass = require(rootPrefix+'/lib/contract_interact/openst_value)
  , openSTValueContractInteract = new openSTValueContractInteractKlass()
  , BigNumber = require('bignumber.js');

const FS = require('fs')
      ,Path = require('path')
      ,readline = require('readline')
      ,Web3 = require("web3")
      ,reqPrefix = ".."
      ,UtilityToken = require( reqPrefix + '/lib/bt')
      ,StakeContract = require(reqPrefix + '/lib/stakeContract')
      ,Geth = require(reqPrefix + "/lib/geth")
      ,logger = require("./helpers/CustomConsoleLogger")
      ,Config = require(process.argv[2] || (reqPrefix + '/config.json') )
      ,coreConstants = require(reqPrefix + '/config/core_constants')
      ,coreAddresses = require(reqPrefix+'/config/core_addresses')
      ,FOUNDATION_ADDRESS = coreAddresses.getAddressForUser('foundation')
      ,REGISTRAR_ADDRESS = coreAddresses.getAddressForUser('registrar')
      ,UC = "UtilityChain"
      ,UC_MAIN_NET_ID = 20171010
      ,VC_MAIN_NET_ID = 20171011
      ,VC = "ValueChain"
;



const toWeiST = ( amt => {
  return new BigNumber( 10 ).pow( 18 ).mul( amt );
});

const toDisplayST = function ( num ) {
  var bigNum = new BigNumber( num );
  var fact = new BigNumber( 10 ).pow( 18 );
  return bigNum.dividedBy( fact ).toString( 10 ) + " ST";
}

String.prototype.equalsIgnoreCase = function ( compareWith ) {
    var _self = this.toLowerCase();
    var _compareWith = String( compareWith ).toLowerCase();
    return _self == _compareWith;
}



const ST = (function () {
  const ContractJson = require( reqPrefix + "/contracts/SimpleToken.json")
        ,contractAddress = coreAddresses.getAddressForContract('simpleToken')
        ,contractAbi = JSON.parse( ContractJson.contracts["SimpleToken.sol:SimpleToken"].abi )
        ,contract = new Geth.ValueChain.eth.Contract( contractAbi, contractAddress )
  ;
  contract.setProvider(Geth.ValueChain.currentProvider);
  return contract;
})();

const stakingContract = (function () {
  const ContractJson = require( reqPrefix + "/contracts/Staking.json")
        ,contractAddress = coreAddresses.getAddressesForContract('staking')
        ,contractAbi = JSON.parse( ContractJson.contracts["Staking.sol:Staking"].abi )
        ,contract = new Geth.ValueChain.eth.Contract( contractAbi, contractAddress )
  ;
  contract.setProvider(Geth.ValueChain.currentProvider);
  return contract;
})();


var is_uc_main_net = false
    ,is_vc_main_net = false
;

const describeChain = function(chainType, web3Provider) {
  return web3Provider.eth.net.getId().then(
    function(networkId){
      logger.info( chainType, "NetworkId: ", networkId );
      logger.info( VC, "HttpProvider.host: ", web3Provider.currentProvider.host );
    }
  )
};

const describeMember = function( member ) {
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

const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '>'
});



const listAllMembers = function() {
  const is_on_main_net = is_uc_main_net || is_vc_main_net;
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

const getMemberSTBalance = function( member ) {
  return simpleTokenContractInteract.balanceOf( member.Reserve )
  .then( function(result){
    const memberBalance = result.data['balance'];
    logger.info(member.Name, "has", toDisplayST(memberBalance) );
    return new BigNumber(memberBalance);
  })
};

const askStakingAmount = function(bigNumBalance) {
  return new Promise( function(resolve, reject) {
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

const getPassphrase = function( selectedMember ) {
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
}

const checkAllowanceAndApproveIfNeeded = function(member, passphrase, toStakeAmount) {
  return simpleTokenContractInteract.allowance(member.Reserve, openSTValueContractAddress)
    .then( function(result) {
      const allowance = result.data.remaining
        , bigNumAllowance = new BigNumber( allowance )
        , needsApproval = (bigNumAllowance != toStakeAmount);

      logger.info(member.Name, "Allowance:", toDisplayST(allowance) );

      if (needsApproval){
        if ( bigNumAllowance != 0 ) {
          logger.info("Resetting Allowance to 0");
          //Reset allowance
          return simpleTokenContractInteract.approve(member.Reserve, passphrase, openSTValueContractAddress, 0)
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
      logger.info("Approving StakingContract with " , toDisplayST(toStakeAmount));
      return simpleTokenContractInteract.approve(member.Reserve, passphrase, openSTValueContractAddress, toStakeAmount);
    })
    .then( function(){
      return simpleTokenContractInteract.allowance(member.Reserve, openSTValueContractAddress)
        .then( function(result) {
          const allowance = result.data.remaining;
          logger.info("Current Allowance:",allowance);
        });
    });
};

function listenToUtilityToken( member, mintingIntentHash ) {
  const utilityChain = new Web3( coreConstants.OST_GETH_UTILITY_WS_PROVIDER );
  const utilityTokenContract = (function () {
    const ContractJson = require( reqPrefix + "/contracts/UtilityToken.json")
          ,contractAddress = member.ERC20
          ,contractAbi = JSON.parse( ContractJson.contracts["UtilityToken.sol:UtilityToken"].abi )
          ,contract = new utilityChain.eth.Contract( contractAbi, contractAddress )
    ;
    contract.setProvider( utilityChain.currentProvider );
    return contract;
  })();

  return new Promise( (resolve, reject) => {
    utilityTokenContract.events.MintingIntentConfirmed({})
      .on('error', (errorObj =>{
        logger.error("Could not Subscribe to MintingIntentConfirmed");
        reject();
      }))
      .on('data', (eventObj => {
        logger.info("data :: MintingIntentConfirmed");
        const returnValues = eventObj.returnValues;
        if ( returnValues ) {
          const _mintingIntentHash = returnValues._mintingIntentHash;
          if ( mintingIntentHash.equalsIgnoreCase( _mintingIntentHash ) ) {
            resolve( eventObj );
          }
        }
      }))
    ;
  });
}

(function () {
  var selectedMember = null
      ,memberBalance = null
      ,toStakeAmount  = null
      ,stakeContract = null
      ,mintingIntentHash = null
      ,utilityToken = null
      ,_passphrase = null
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
    .then(function(){
      logger.step("Confirm Member");
      return (confirmMember( Config.Members[0] ) )
    })
    .then( function(member){
      selectedMember = member;
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
      logger.step("Validate Current Allowance");
      return checkAllowanceAndApproveIfNeeded(selectedMember, _passphrase, toStakeAmount) ;
    })
    .then( function() {
      logger.win("Stake Current Allowance validated");

      logger.step("Staking ", toDisplayST( toStakeAmount ) );
      return openSTValueContractInteract.stake(selectedMember.Reserve, selectedMember.UUID, toStakeAmount);
    })
    .then( function(result) {



      //Todo
      //Todo
      //Todo
      //Todo
      //Todo







      const stakeTX = result.data.transactionReceipt;
      logger.win("Staked", toDisplayST( toStakeAmount ) );
      const stakeReturnValues     = stakeTX.events.MintingIntentDeclared.returnValues
            ,escrowUnlockHeight   = stakeReturnValues._escrowUnlockHeight
            ,nonce                = stakeReturnValues._stakerNonce
            ,stakeUT              = stakeReturnValues._amountUT
            ,stakeST              = stakeReturnValues._amountST
      ;
      mintingIntentHash = stakeReturnValues._mintingIntentHash

      logger.info("Transaction Hash:", stakeTX.transactionHash);
      logger.info("EscrowUnlockHeight:", escrowUnlockHeight);
      logger.info("Nonce:", nonce);
      logger.info("Staked SimpleToken", toDisplayST( stakeST ) );
      logger.info("Staked UtilityToken", stakeUT);
      logger.info("MintingIntentHash", mintingIntentHash)
      logger.info("Transaction Receipt");
      console.log("\n------------------", JSON.stringify( stakeTX ), "\n------------------" );
      return mintingIntentHash;
    })
    .then( mintingIntentHash => {
      logger.step("Waiting for Minting Intent Confirmation");
      return listenToUtilityToken(selectedMember, mintingIntentHash);
    })
    .then( eventObj => {
      logger.win("Received MintingIntentConfirmed");
      logger.step("Process Staking on ValueChain");
      return stakeContract.processStaking(selectedMember.Reserve, selectedMember.UUID, mintingIntentHash );
    })
    .then( _ => {
      logger.win("Completed processing Stake");
      logger.step("Unlocking Reserve on UtilityChain to mint");
      return Geth.UtilityChain.eth.personal.unlockAccount( selectedMember.Reserve, _passphrase );
    })
    .then( _ => {
      logger.win("Unlocked Successfully");
      logger.step("Process Minting")
      utilityToken = new UtilityToken(selectedMember.Reserve, selectedMember.ERC20);
      return utilityToken._btInstance.methods.processMinting(mintingIntentHash).send({
        from: selectedMember.Reserve,
        gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE
      })
    })
    .then( _ => {
      logger.win("Minting Completed!");
      process.exit(0);
    })
    .catch(reason => {
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

