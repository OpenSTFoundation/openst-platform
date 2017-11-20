"use strict";
/*
 * *
 * * Author: Rachin Kapoor
 * * Date: 12/10/2017
 * * Reviewed by:
 * * 
 */
const FS = require('fs')
      ,Path = require('path')
      ,BigNumber = require('bignumber.js')
      ,readline = require('readline')
      ,Web3 = require("web3")
      ,reqPrefix = ".."
      ,UtilityToken = require( reqPrefix + '/lib/bt')
      ,StakeContract = require(reqPrefix + '/lib/stakeContract')
      ,Geth = require(reqPrefix + "/lib/geth")
      ,logger = require("./helpers/CustomConsoleLogger")
      ,Config = require(process.argv[2] || (reqPrefix + '/config.json') )
      ,coreConstants = require(reqPrefix + '/config/core_constants')
      ,stakingContractAddress = coreConstants.OST_STAKE_CONTRACT_ADDRESS
      ,FOUNDATION_ADDRESS = coreConstants.OST_FOUNDATION_ADDRESS
      ,REGISTRAR_ADDRESS = coreConstants.OST_REGISTRAR_ADDRESS
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
        ,contractAddress = coreConstants.OST_SIMPLETOKEN_CONTRACT_ADDRESS
        ,contractAbi = JSON.parse( ContractJson.contracts["SimpleToken.sol:SimpleToken"].abi )
        ,contract = new Geth.ValueChain.eth.Contract( contractAbi, contractAddress )
  ;
  contract.setProvider(Geth.ValueChain.currentProvider);
  return contract;
})();

const stakingContract = (function () {
  const ContractJson = require( reqPrefix + "/contracts/Staking.json")
        ,contractAddress = coreConstants.OST_STAKE_CONTRACT_ADDRESS
        ,contractAbi = JSON.parse( ContractJson.contracts["Staking.sol:Staking"].abi )
        ,contract = new Geth.ValueChain.eth.Contract( contractAbi, contractAddress )
  ;
  contract.setProvider(Geth.ValueChain.currentProvider);
  return contract;
})();


var is_uc_main_net = false
    ,is_vc_main_net = false
;

//Method to validate ValueChain. Ensures no one 'accidentally' deploys on Mainnet.
function validateValueChain() {
  return Geth.ValueChain.eth.net.getId(function (error, result) {
    //Ensure ValueChain is not on MainNet. networkId should NOT be 1.
    if ( result == VC_MAIN_NET_ID ) {
      is_vc_main_net = true;
      logger.warn(VC, "is connected to networkId", result ,"(", VC ,"Mainnet)");
    }
  })
  .catch( reason =>  {
    //Inform user to add 'net' option to rpcapi.
    logger.error( "Could not verify network id of ValueChain" );
    logger.info( "When starting your geth node, make sure to include net and web3 in the --rpcapi argument, e.g. \n        --rpcapi \"net,eth,web3,personal\"");
    throw "Could not verify network id of ValueChain";
  })
  .then( networkId => {
    logger.info( VC, "NetworkId: ", networkId );
    logger.info( VC, "HttpProvider.host: ", Geth.ValueChain.currentProvider.host );
  });
}

//Method to validate UtilityChain. Ensures no one 'accidentally' deploys on Mainnet.
function validateUtilityChain() {
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
    throw "Could not verify network id of " + UC;
  })
  .then( networkId => {
    logger.info( UC, "NetworkId: ", networkId );
    logger.info( UC, "HttpProvider.host: ", Geth.UtilityChain.currentProvider.host );
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '>'
});



function listAllMembers() {
  const is_on_main_net = is_uc_main_net || is_vc_main_net;
  console.log("\x1b[34m Welcome to Staking And Minting Tool \x1b[0m");
  logger.warn("You are connected to main net.");
  logger.step("Please choose member to fund.");
  //List all available members.
  for( var i =0; i < Config.Members.length; i++  ) {
    var member = Config.Members[ i ];
    console.log( i+1, " for ", member.Name, "(", member.Symbol ,")"  );
  }
  
  return new Promise( (resolve, reject) => {
    rl.prompt();
    const rlCallback = (line) => {
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
      rl.removeListener("line", rlCallback);
      const member = Config.Members[ memberIndex ];
      resolve( member );
    };
    rl.on("line", rlCallback);
  });
}

function confirmMember(member) {
  describeMember( member );
  console.log("\x1b[34m Are you sure you would like to continue with Staking And Minting ? Options:\x1b[0m");
  console.log("\x1b[32m yes \x1b[0m\t" , "To continue with Staking And Minting");
  console.log("\x1b[31m no \x1b[0m\t" , "To quit the program");
  return new Promise( (resolve, reject) => {
    rl.prompt();
    const rlCallback = (line) => {
      console.log("confirmMember :: rl :: line", line);
      line = line.trim().toLowerCase();
      switch ( line ) {
        case "yes":
        case "y":
          rl.removeListener("line", rlCallback);
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
    rl.on("line", rlCallback);
  });
}

function getMemberSTBalance( member ) {
  return ST.methods.balanceOf( member.Reserve ).call()
  .then( memberBalance => {
    logger.info(member.Name, "has", toDisplayST(memberBalance) );
    return new BigNumber( memberBalance );
  })
}

function askStakingAmount( bigNumBalance ) {
  return new Promise( (resolve, reject) => {
    rl.prompt();
    const rlCallback = (line) => {
      console.log("askStakingAmount :: rl :: line", line);
      line = line.trim().toLowerCase();
      switch ( line ) {
        case "exit":
        case "bye":
          logger.log("Staking Aborted. Bye");
          process.exit(0);
        break;
      }
      const amt = Number( line );
      if ( isNaN( amt ) ) {
        logger.error("amount is not a number. amount:", line);
        return;
      }
      const bigNumStakeAmount = toWeiST( line );
      console.log("bigNumStakeAmount" , bigNumStakeAmount);
      if ( bigNumStakeAmount.cmp( bigNumBalance ) > 0 ) {
        logger.error("Member does not have sufficient SimpleTokens to stake " + toDisplayST(bigNumStakeAmount) );
        return;
      }
      rl.removeListener("line", rlCallback);
      resolve( bigNumStakeAmount );
    };
    rl.on("line", rlCallback);
  });
}

function getPassphrase( selectedMember ) {
  const hideConsoleString = "\x1b[8m";
  const resetConsoleString = "\x1b[0m";
  logger.step("Please provide member reserve passphrase.");
  return new Promise( (resolve, reject) => {
    rl.setPrompt("Passphrase:" + hideConsoleString);
    rl.prompt();
    const rlCallback = ( passphrase ) => {
      logger.step(resetConsoleString, "Unlocking Member Reserve on", VC);
      Geth.ValueChain.eth.personal.unlockAccount(selectedMember.Reserve, passphrase)
      .then(_ => {
        logger.win("Member Reserve unlocked on", VC);
        rl.removeListener("line", rlCallback);
        resolve( passphrase );
      })
      .catch( reason => {
        logger.error("Failed to unlock reserve.");
        logger.error(reason.message);
        logger.step("Please provide member reserve passphrase." , hideConsoleString);
      });
    };
    rl.on("line", rlCallback);
  });
}

function validateCurrentAllowance( member, stakedAmount) {
  const MC = member.Reserve;
  return ST.methods.allowance(member.Reserve, stakingContractAddress).call({from: member.Reserve})
    .then( allowance => {
      logger.info(member.Name, "Allowance:", toDisplayST(allowance) );
      const bigNumAllowance = new BigNumber( allowance );
      const needsApproval = bigNumAllowance != stakedAmount;

      if ( bigNumAllowance != stakedAmount ){
        if ( bigNumAllowance != 0 ) {
          logger.info("Resetting Allowance to 0");
          //Reset allowance
          return ST.methods.approve(stakingContractAddress, 0).send({from: member.Reserve})
            .then( _=> {
              logger.info("Current Allowance has been set to 0");
              return needsApproval;
            });
        }
      }
      return needsApproval;
    })
    .then( needsApproval => {
      if ( !needsApproval ) {
        return true;
      }
      logger.info("Approving StakingContract with " , toDisplayST(stakedAmount));
      return  ST.methods.approve(stakingContractAddress, stakedAmount).send({from: member.Reserve})
    })
    .then( _ => {
      return ST.methods.allowance(member.Reserve, stakingContractAddress).call({from: member.Reserve})
        .then( allowance => {
          logger.info("Current Allowance:",allowance);
        })
    });
    
}

function validateStakeContract ( stakeContract, member ) {
    return stakeContract._instance.methods.adminAddress().call()
      .then(stakeAdmin => {
        if ( !REGISTRAR_ADDRESS.equalsIgnoreCase( stakeAdmin ) ) {
          throw "StakeContract REGISTRAR_ADDRESS validation failed";
        }
      })
      .then(_ => {
        return stakeContract._instance.methods.utilityTokens(member.UUID).call()
          .then(utilityToken => {
            
            if ( !utilityToken ) {
              throw "Invalid UtilityToken";
            }
            if ( !member.Reserve.equalsIgnoreCase( utilityToken.stakingAccount )  ) {
              console.log( JSON.stringify( utilityToken, null, 2 ));
              throw "Invalid stakingAccount";
            }
            if ( !member.ChainId.equalsIgnoreCase( utilityToken.chainId) ) {
              console.log( JSON.stringify( utilityToken, null, 2 ));
              throw "Invalid ChainId";
            }
          })
        ;
      })
    ;
}

function listenToUtilityToken( member, mintingIntentHash ) {
  const utilityChain = new Web3( coreConstants.OST_GETH_UTILITY_CHAIN_WS_PROVIDER );
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
      ,stakedAmount  = null
      ,stakeContract = null
      ,stakeTransaction = null
      ,mintingIntentHash = null
      ,utilityToken = null
      ,_passphrase = null
  ;
  logger.step("Validate", VC);
  validateValueChain()
    .then( _ => {
      logger.win(VC, "Validated");
      logger.step("Validate", UC);
      return validateUtilityChain()
    })
    .then( listAllMembers )
    .then(_ => {
      logger.win(UC, "Validated");
      logger.step("Confirm Member");
      return (confirmMember( Config.Members[0] ) )
    })
    .then( member => {
      selectedMember = member;
      logger.step("Get Member ST Balance");
      return getMemberSTBalance( selectedMember );
    })
    .then( bigNumBalance => {
      memberBalance = bigNumBalance;
      return askStakingAmount( bigNumBalance );
    })
    .then( bigNumStakeAmount => {
      logger.step("Validate Stake Contract");
      stakedAmount = bigNumStakeAmount;
      stakeContract = new StakeContract(FOUNDATION_ADDRESS, stakingContractAddress);
      return validateStakeContract( stakeContract, selectedMember );
    })
    .then( _ => {
      logger.win("Stake Contract Validated");
      return getPassphrase( selectedMember );
    })
    .then( passphrase => {
      logger.win("Member Reserve unlocked on", VC);
      _passphrase = passphrase;
      logger.step("Validate Current Allowance");
      return validateCurrentAllowance(selectedMember, stakedAmount) ;
    })
    .then( _ => {
      logger.win("Stake Current Allowance validated");

      logger.step("Staking ", toDisplayST( stakedAmount ) );
      return stakeContract.stake(selectedMember.Reserve, selectedMember.UUID, stakedAmount);
    })
    .then( stakeTX => {
      logger.win("Staked", toDisplayST( stakedAmount ) );
      stakeTransaction = stakeTX;
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
      return utilityToken._btInstance.methods.processMinting(mintingIntentHash).send({from: selectedMember.Reserve})      
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

