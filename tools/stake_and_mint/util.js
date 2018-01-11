"use strict";

/**
 * This is utility for performing stake and mint.<br><br>
 *   Stake and mint is called in two variations:<br>
 *     <ol>
 *       <li>For branded token: {@link module:tools/stake_and_mint/for_branded_token}</li>
 *       <li>For simple token prime: {@link module:tools/stake_and_mint/for_st_prime}</li>
 *     </ol>
 *
 * This utility has common functionality which is required for both these variations.
 * Following are the steps which are performed in here:
 * <ol>
 *  <li>Staker address approves openSTValue contract address for toStakeAmount.
 *  We first check the current allowance and go for approval only when the current allowance and toStakeAmount
 *  are different.</li>
 *  <li>Staker address calls stake method of openSTValue contract. In the transaction receipt, we asset for StakingIntentDeclared event.</li>
 *  <li>Wait for openSTUtility contract to give StakingIntentConfirmed event.
 *  Proceed to next step if _stakingIntentHash in the event matches the same got in StakingIntentDeclared.</li>
 *  <li>Staker address calls processStaking of openSTValue contract.</li>
 *  <li>Staker address calls processMinting of openSTUtility contract.</li>
 *  <li>Staker address calls claim of utilityTokenInterface contract.</li>
 * </ol>
 *
 * @module tools/stake_and_mint/util
 */

const BigNumber = require('bignumber.js')
  , readline    = require('readline')
;

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , coreConstants = require( rootPrefix + '/config/core_constants' )
  , web3UtilityWsProvider = require(rootPrefix+'/lib/web3/providers/utility_ws')
  , eventsFormatter = require(rootPrefix+'/lib/web3/events/formatter.js')
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  , simpleTokenContractInteract = require(rootPrefix+'/lib/contract_interact/simpleToken')
  , openSTValueContractInteractKlass = require(rootPrefix+'/lib/contract_interact/openst_value')
  , openSTUtilityContractInteractKlass = require(rootPrefix+'/lib/contract_interact/openst_utility')
;

const VC = "ValueChain"
  , openSTValueContractName = 'openSTValue'
  , openSTUtilityContractName = 'openSTUtility'
  , openSTUtilityContractABI = coreAddresses.getAbiForContract(openSTUtilityContractName)
  , openSTValueContractAddress =  coreAddresses.getAddressForContract(openSTValueContractName)
  , openSTUtilityContractAddress =  coreAddresses.getAddressForContract(openSTUtilityContractName)
  , openSTValueContractInteract = new openSTValueContractInteractKlass()
  , openSTUtilityContractInteract = new openSTUtilityContractInteractKlass()
;

/**
 * convert amount to wei
 *
 * @param {Bignumber} amount - The amount in ST
 *
 * @return {Bignumber} converted amount in wei.
 */
const toWeiST = function(amount){
  return new BigNumber( 10 ).pow( 18 ).mul( amount );
};

/**
 * display value in ST
 *
 * @param {Bignumber} num - number of ST wei
 *
 * @return {String} display value in ST
 */
const toDisplayST = function(num){
  var bigNum = new BigNumber( num )
    , fact = new BigNumber( 10 ).pow( 18 );

  return bigNum.dividedBy( fact ).toString( 10 ) + " ST";
};

/**
 * is equal ignoring case
 *
 * @param {String} compareWith - string to compare with
 *
 * @return {Bool} true when equal
 */
String.prototype.equalsIgnoreCase = function(compareWith){
  var _self = this.toLowerCase()
    , _compareWith = String( compareWith ).toLowerCase();

  return _self == _compareWith;
};

/**
 * Describe chain
 *
 * @param {String} chainType - Chain type
 * @param {Web3} web3Provider - web3 provider
 *
 * @return {Promise<Number>}
 */
const describeChain = function(chainType, web3Provider) {
  return web3Provider.eth.net.getId()
    .then(function(networkId){
      logger.info( chainType, "NetworkId: ", networkId );
      logger.info( VC, "HttpProvider.host: ", web3Provider.currentProvider.host );
    }
  )
};

/**
 * Describe member
 *
 * @param {Object} member - member object
 *
 */
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

/**
 * Get ST balance
 *
 * @param {String} address - Address to get the ST balance
 *
 * @return {Promise<BigNumber>}
 */
const getSTBalance = function( address ){
  return simpleTokenContractInteract.balanceOf( address )
  .then( function(result){
    const stBalance = result.data['balance'];
    logger.info("Address", address, "has", toDisplayST(stBalance) );
    return new BigNumber(stBalance);
  })
};

/**
 * Check allowance and approve if needed
 *
 * @param {String} stakerAddress - Staker address
 * @param {String} passphrase - Staker address passphrase
 * @param {Number} toStakeAmount - to stake amount
 *
 * @return {Promise}
 */
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

/**
 * Listen to utility token contract
 *
 * @param {String} stakingIntentHash - Staking intent hash
 *
 * @return {Promise}
 */
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

/**
 * perform stake and mint
 *
 * @param {String} stakerAddress - Address of the staker
 * @param {String} stakerPassphrase - Passphrase of staker address
 * @param {String} beneficiary - Address of the beneficiary
 * @param {Number} toStakeAmount - Amount to stake in ST
 * @param {utilityTokenInterfaceKlass} utilityTokenInterfaceContract - Contract interact class object for utility token interface contract
 * @param {Number} conversionRate - conversion rate from st to bt, default 1
 *
 *
 * @return {Promise}
 */
module.exports = function (stakerAddress, stakerPassphrase, beneficiary, toStakeAmount, utilityTokenInterfaceContract, conversionRate) {
  toStakeAmount = toWeiST( toStakeAmount );
  var selectedMember = null
    , eventDataValues = null
    , conversionRate = conversionRate || 1
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
        logger.info( JSON.stringify( response ) );
        return response.data.uuid;
      });
    })
    .then( function( uuid ) {
      logger.win("Staker Current Allowance validated");

      logger.step("Staking ", toDisplayST( toStakeAmount ) );

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
        logger.info( "Staking resulted in error: \n" );
        logger.info(result);
        return Promise.reject( result );
      }

      const formattedTransactionReceipt = result.data.formattedTransactionReceipt
        , rawTxReceipt = result.data.rawTransactionReceipt;

      var eventName = 'StakingIntentDeclared'
        , formattedEventData = await eventsFormatter.perform(formattedTransactionReceipt);

      eventDataValues = formattedEventData[eventName];

      if (!eventDataValues){
        logger.info( "Staking was not completed correctly: StakingIntentDeclared event didn't found in events data: \n");
        logger.info("rawTxReceipt is:\n");
        logger.info(rawTxReceipt);
        logger.info("\n\n formattedTransactionReceipt is:\n");
        logger.info(formattedTransactionReceipt);
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
    .then(async function(){
      // pessimistically perform cache update
      var cachedBalance = await utilityTokenInterfaceContract.getBalanceFromCache(beneficiary);

      if(cachedBalance){
        // if cache value is present
        // add the amount which is minted and set the new value to cache.
        cachedBalance = new BigNumber(cachedBalance).plus(toStakeAmount.mul(conversionRate));
        return utilityTokenInterfaceContract.setBalanceToCache(beneficiary, cachedBalance)
      } else {
        // else do nothing
        return Promise.resolve();
      }
    })
    .then(async function () {
      logger.info("Beneficiary Address: "+ beneficiary);
      logger.info("Beneficiary Balance: ");
      logger.info( await utilityTokenInterfaceContract.getBalanceOf( beneficiary ) );
      return Promise.resolve({success: true});
    })
    .catch(function(reason){
      stakerPassphrase = null;
      if ( reason && reason.message ){
        logger.error( reason.message );
      }
      reason && logger.info( reason );
      return Promise.reject({success: true, reason: reason});
    })
  ;
  stakerPassphrase = null;
};