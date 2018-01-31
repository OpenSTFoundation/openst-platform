"use strict";

const BigNumber = require('bignumber.js')
  , readline = require('readline')
;

const rootPrefix = '../..'
  , web3UtilityRpcProvider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , web3ValueWsProvider = require(rootPrefix + '/lib/web3/providers/value_ws')
  , web3UtilityWsProvider = require(rootPrefix + '/lib/web3/providers/utility_ws')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , coreConstants   = require( rootPrefix + '/config/core_constants' )
  , BrandedTokenContractInteractKlass = require(rootPrefix + '/lib/contract_interact/branded_token')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , Config = require( process.argv[2] || coreConstants.OST_MEMBER_CONFIG_FILE_PATH )
  , eventsFormatter = require(rootPrefix + '/lib/web3/events/formatter.js')
  , openSTValueContractInteractKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
  , OpenSTUtilityContractInteractKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
;

const openSTValueContractName = 'openSTValue'
  , UC = "UtilityChain"
  , VC = "ValueChain"
  , openSTUtilityContractName = 'openSTUtility'
  , openSTValueContractABI = coreAddresses.getAbiForContract(openSTValueContractName)
  , openSTValueContractAddress = coreAddresses.getAddressForContract(openSTValueContractName)
  , openSTUtilityContractAddress = coreAddresses.getAddressForContract(openSTUtilityContractName)
  , openSTValueContractInteract = new openSTValueContractInteractKlass(openSTValueContractAddress)
  , openSTUtilityContractInteract = new OpenSTUtilityContractInteractKlass(openSTUtilityContractAddress)
;

var brandedToken          = null
  , selectedMember        = null
  , redeemerAddress       = null
  , redeemerPassphrase    = null
  , redeemerBtBalance     = null
  , toRedeemAmount        = null
  , redeemerNonce         = null
  , tokenUuid             = null
  , redemptionIntentHash  = null
;

/**
 * @ignore
 */
const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '>'
});

/**
 * is equal ignoring case
 *
 * @param {String} compareWith - string to compare with
 *
 * @return {Bool} true when equal
 */
String.prototype.equalsIgnoreCase = function (compareWith) {
  var _self = this.toLowerCase()
    , _compareWith = String(compareWith).toLowerCase();

  return _self == _compareWith;
};


const toWeiST = function(amount){
  return new BigNumber( 10 ).pow( 18 ).mul( amount );
};


/**
 * Describe token
 *
 * @param {Object} member - member object
 *
 */
const describeToken = function (member) {
  logger.step("Please Confirm these details.");
  logger.log("Name ::", member.Name);
  logger.log("Symbol ::", member.Symbol);

  var ignoreKeys = ["Name", "Symbol", "Reserve"]
    , allKeys = Object.keys(member)
  ;
  allKeys.forEach(function (prop) {
    if (ignoreKeys.includes(prop)) {
      return;
    }

    var val = member[prop];
    if (val instanceof Object) {
      return;
    }

    logger.log(prop, "::", val);
  });
};

/**
 * to display value in base unit
 *
 * @param {Bignumber} weiAmount - amount in wei
 *
 * @return {String} display value in base unit
 */
const toDisplayInBaseUnit = function (weiAmount) {
  var bigNum = new BigNumber(weiAmount)
    , fact = new BigNumber(10).pow(18);

  return bigNum.dividedBy(fact).toString(10);
};


/**
 * Describe chain
 *
 * @param {String} chainType - Chain type
 * @param {Web3} web3Provider - web3 provider
 *
 * @return {Promise<Number>}
 */
const describeChain = function (chainType, web3Provider) {
  logger.step("Validate", chainType);
  return web3Provider.eth.net.getId().then(function (networkId) {
      logger.info(chainType, "NetworkId: ", networkId);
      logger.info(chainType, "HttpProvider.host: ", web3Provider.currentProvider.host);
      logger.win(chainType, "Validated");
    })
};

const describeValueChain = function () {
  return describeChain(VC, web3UtilityWsProvider);
};

const describeUtilityChain = function () {
  return describeChain(UC, web3UtilityRpcProvider);
};

/**
 * List all members
 */
const listAllTokens = function () {
  logger.info("\x1b[34m Welcome to Un Staking And Redeeming Tool \x1b[0m");
  logger.step("Please choose utility token to redeem.");

  //List all available members.
  for (var i = 0; i < Config.Members.length; i++) {
    var member = Config.Members[i];
    logger.info(i + 1, " for ", member.Name, "(", member.Symbol, ")");
  }

  return new Promise(function (resolve, reject) {
    readlineInterface.prompt();
    const rlCallback = function (line) {
      logger.info("listAllMembers :: line", line);
      line = line.trim().toLowerCase();
      switch (line) {
        case "exit":
        case "bye":
          logger.log("Redeeming Aborted. Bye");
          process.exit(0);
          break;
      }
      var memberIndex = Number(line) - 1;
      logger.info("Choosing utility token : ", memberIndex);
      if (isNaN(memberIndex) || memberIndex >= Config.Members.length) {
        logger.info("\n");
        logger.error("Invalid Option. Please try again.");
        logger.info("\n");
        return;
      }
      logger.info(rlCallback);
      readlineInterface.removeListener("line", rlCallback);
      const member = Config.Members[memberIndex];
      resolve(member);
    };
    readlineInterface.on("line", rlCallback);
  });
};

/**
 * Confirm token
 *
 * @param {Object} member
 *
 * @return {Promise<Object>}
 */
const confirmToken = function (member) {
  logger.step("Confirm Token");
  describeToken(member);
  logger.info("\x1b[34m Are you sure you would like to continue with Unstaking And Redeeming ? Options:\x1b[0m");
  logger.info("\x1b[32m yes \x1b[0m\t", "To continue with Unstaking And Redeeming");
  logger.info("\x1b[31m no \x1b[0m\t", "To quit the program");
  return new Promise(function (resolve, reject) {
    readlineInterface.prompt();
    const rlCallback = function (line) {
      logger.info("confirmMember :: confirmToken :: line", line);
      line = line.trim().toLowerCase();
      switch (line) {
        case "yes":
        case "y":
          readlineInterface.removeListener("line", rlCallback);
          selectedMember = member;
          brandedToken = new BrandedTokenContractInteractKlass(selectedMember);
          resolve(selectedMember);
          break;
        case "no":
        case "n":
        case "exit":
        case "bye":
          logger.log("Unstaking And Redeeming Aborted. Bye");
          process.exit(0);
          break;
        default:
          logger.error("Invalid Input. Supported Inputs: yes/no/exit");
      }
    };
    readlineInterface.on("line", rlCallback);
  });
};

/**
 * Get uuid of the token
 *
 * @return {Promise}
 */
const getUuidForToken = async function () {
  const getUuidResult = await brandedToken.getUuid();

  if (getUuidResult.isSuccess()) {
    tokenUuid = getUuidResult.data.uuid;
    return Promise.resolve();
  } else {
    return Promise.reject('error in finding uuid of Member:', selectedMember);
  }
};

/**
 * Ask redeemer address
 *
 * @return {Promise}
 */
const askRedeemerAddress = function () {
  return new Promise(function (resolve, reject) {
    logger.info("Please mention the address of the redeemer.");
    readlineInterface.prompt();
    const rlCallback = function (line) {
      logger.info("askRedeemerAddress :: readlineInterface :: line", line);
      line = line.trim().toLowerCase();

      switch (line) {
        case "exit":
        case "bye":
          logger.log("Redeeming Aborted. Bye");
          process.exit(0);
          break;
      }

      const address = line;

      // sanitize the address here to capitalization checksum.

      readlineInterface.removeListener("line", rlCallback);
      redeemerAddress = address;
      resolve(address);
    };
    readlineInterface.on("line", rlCallback);
  });
};

/**
 * Ask redeemer passphrase
 *
 * @return {Promise}
 */
const askRedeemerPassphrase = function () {
  return new Promise(function (resolve, reject) {
    logger.info("Please mention the passphrase of the redeemer.");
    readlineInterface.prompt();
    const rlCallback = function (line) {
      logger.info("askRedeemerAddress :: readlineInterface :: line", line);
      line = line.trim();

      const passphrase = line;

      readlineInterface.removeListener("line", rlCallback);
      redeemerPassphrase = passphrase;
      resolve();
    };
    readlineInterface.on("line", rlCallback);
  });
};

/**
 * Get redeemer BT balance
 *
 * @param {Address} redeemer - redeemer adddress
 *
 * @return {Promise<Number>}
 */
const getRedeemerBTBalance = function () {
  return brandedToken.getBalanceOf(redeemerAddress).then(
    function (res) {
      if (res.isSuccess()) {
        redeemerBtBalance = res.data.balance;
        return Promise.resolve();
      } else {
        return Promise.reject('Unable to get balance of the redeemer.')
      }
    }
  );
};

/**
 * Ask redeeming amount
 *
 * @return {Promise}
 */
const askRedeemingAmount = function () {
  return new Promise(function (resolve, reject) {
    logger.info("Please mention the number of branded tokens to redeem.");
    readlineInterface.prompt();
    const rlCallback = function (line) {
      logger.info("askRedeemingAmount :: readlineInterface :: line", line);
      line = line.trim().toLowerCase();

      switch (line) {
        case "exit":
        case "bye":
          logger.log("Redeeming Aborted. Bye");
          process.exit(0);
          break;
      }

      const amt = Number(line);
      if (isNaN(amt)) {
        logger.error("amount is not a number. amount:", line);
        return;
      }
      const bigNumRedeemingAmount = toWeiST( new BigNumber(line) );
      logger.log("bigNumRedeemingAmount", bigNumRedeemingAmount);
      if (bigNumRedeemingAmount.cmp(redeemerBtBalance) > 0) {
        logger.error("Redeemer does not have sufficient branded tokens to redeem " + toDisplayInBaseUnit(bigNumRedeemingAmount));
        reject("Redeemer does not have sufficient branded tokens to redeem " + toDisplayInBaseUnit(bigNumRedeemingAmount));
      }
      readlineInterface.removeListener("line", rlCallback);
      toRedeemAmount = bigNumRedeemingAmount;
      resolve(bigNumRedeemingAmount);
    };
    readlineInterface.on("line", rlCallback);
  });
};

/**
 * Set approval for openSTUtility contract
 *
 * @return {Promise}
 */
const setApprovalForopenSTUtilityContract = function () {
  return brandedToken.allowance(redeemerAddress, openSTUtilityContractAddress)
    .then(function (result) {
      const allowance = result.data.remaining
        , bigNumAllowance = new BigNumber(allowance)
        , needsApproval = (bigNumAllowance != toRedeemAmount);

      logger.info("Redeemer Allowance for openSTUtility contract:", toDisplayInBaseUnit(allowance));

      if (needsApproval) {
        if (bigNumAllowance != 0) {
          logger.info("Resetting Allowance to 0, before approving the currently needed allowance.");
          //Reset allowance
          return brandedToken.approve(redeemerAddress, redeemerPassphrase, openSTUtilityContractAddress, 0)
            .then(function () {
              logger.info("Current Allowance has been set to 0");
              return needsApproval;
            });
        }
      }
      return needsApproval;
    })
    .then(function (needsApproval) {
      if (!needsApproval) {
        return true;
      }
      logger.info("Approving openSTUtility contract with ", toDisplayInBaseUnit(toRedeemAmount));
      return brandedToken.approve(redeemerAddress, redeemerPassphrase, openSTUtilityContractAddress, toRedeemAmount);
    })
    .then(function () {
      return brandedToken.allowance(redeemerAddress, openSTUtilityContractAddress)
        .then(function (result) {
          const allowance = result.data.remaining;
          logger.info("Current Allowance:", allowance);
        });
    });
};

/**
 * Get nonce for redeeming
 *
 * @return {Promise}
 */
const getNonceForRedeeming = function () {
  return openSTValueContractInteract.getNextNonce(redeemerAddress).then(
    function (_out) {
      redeemerNonce = _out;
      return true;
    }
  )
};

const redeem = async function () {
  const redeemResult = await openSTUtilityContractInteract.redeem(
    redeemerAddress,
    redeemerPassphrase,
    tokenUuid,
    toRedeemAmount,
    redeemerNonce
  );

  if (redeemResult.isSuccess()) {
    const formattedTransactionReceipt = redeemResult.data.formattedTransactionReceipt
      , rawTxReceipt = redeemResult.data.rawTransactionReceipt;

    var eventName = 'RedemptionIntentDeclared'
      , formattedEventData = await eventsFormatter.perform(formattedTransactionReceipt)
      , eventDataValues = formattedEventData[eventName];

    if (!eventDataValues) {
      logger.info("openSTUtilityContractInteract.redeem was not completed correctly: RedemptionIntentDeclared event didn't found in events data");
      logger.info("rawTxReceipt is:\n");
      logger.info(rawTxReceipt);
      logger.info("\n\n formattedTransactionReceipt is:\n");
      logger.info(formattedTransactionReceipt);
      return Promise.reject("openSTUtilityContractInteract.redeem was not completed correctly: RedemptionIntentDeclared event didn't found in events data");
    }

    logger.win("Redeeming Done.", toDisplayInBaseUnit(toRedeemAmount));

    logger.info("eventDataValues:");
    logger.info(eventDataValues);

    redemptionIntentHash = eventDataValues['_redemptionIntentHash'];

    return Promise.resolve();
  }
};

/**
 * Listen to open st value
 *
 * @return {Promise}
 */
const listenToRedemptionIntentConfirmed = function () {

  return new Promise(function (onResolve, onReject) {

    const openSTValueContract = new web3ValueWsProvider.eth.Contract(
      openSTValueContractABI,
      openSTValueContractAddress
    );

    openSTValueContract.setProvider(web3ValueWsProvider.currentProvider);

    openSTValueContract.events.RedemptionIntentConfirmed({})
      .on('error', function (errorObj) {
        logger.error("Could not Subscribe to RedemptionIntentConfirmed");
        onReject();
      })
      .on('data', function (eventObj) {
        logger.info("data :: RedemptionIntentConfirmed");
        const returnValues = eventObj.returnValues;
        if (returnValues) {
          const _redemptionIntentHash = returnValues._redemptionIntentHash;

          // We need to perform action only if the redemption intent hash matches.
          // Need this check this as there might be multiple redeems(by different member company) on same Utility chain.

          if (redemptionIntentHash.equalsIgnoreCase(_redemptionIntentHash)) {
            onResolve(eventObj);
          }
        }
      });
  });
};

/**
 * Process redeeming
 *
 * @return {Promise}
 */
const processRedeeming = function () {

  logger.win("Completed processing Reedeeming");
  logger.step("Process Unstaking Now.");

  return openSTUtilityContractInteract.processRedeeming(
    redeemerAddress,
    redeemerPassphrase,
    redemptionIntentHash
  );

};

/**
 * Process unstaking
 *
 * @return {Promise}
 */
const processUnstaking = function () {

  logger.win("Completed processing Reedeeming");
  logger.step("Process Unstaking Now.");

  return openSTValueContractInteract.processUnstaking(
    redeemerAddress,
    redeemerPassphrase,
    redemptionIntentHash
  );

};

/**
 * Perform unstake and redeem for branded token
 */
(function () {
  describeValueChain()
    .then(describeUtilityChain)
    .then(listAllTokens)
    .then(confirmToken)
    .then(getUuidForToken)
    .then(askRedeemerAddress)
    .then(askRedeemerPassphrase)
    .then(getRedeemerBTBalance)
    .then(askRedeemingAmount)
    .then(setApprovalForopenSTUtilityContract)
    .then(getNonceForRedeeming)
    .then(redeem)
    .then(listenToRedemptionIntentConfirmed)
    .then(processRedeeming)
    .then(processUnstaking)
    .then(function () {
      logger.win("Yoo.. Have Fun!!");
      process.exit(0);
    })
    .catch(function (reason) {
      if (reason && reason.message) {
        logger.error(reason.message);
      }
      reason && logger.info(reason);
      process.exit(1);
    })
  ;
})();