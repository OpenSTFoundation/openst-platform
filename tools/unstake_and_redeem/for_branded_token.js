"use strict";

const rootPrefix = '../..'
  , web3ValueRpcProvider = require(rootPrefix + '/lib/web3/providers/value_rpc')
  , web3UtilityRpcProvider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , web3UtilityWsProvider = require(rootPrefix + '/lib/web3/providers/utility_ws')
  , simpleTokenContractInteract = require(rootPrefix + '/lib/contract_interact/simpleToken')
  , coreConstants   = require( rootPrefix + '/config/core_constants' )
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , brandedTokenKlass = require(rootPrefix + '/lib/contract_interact/branded_token')
  , stakeAndMintUtil = require(rootPrefix + "/tools/stake_and_mint/util")
  , openSTValueContractName = 'openSTValue'
  , openSTValueContractAddress = coreAddresses.getAddressForContract(openSTValueContractName)
  , openSTUtilityContractName = 'openSTUtility'
  , openSTUtilityContractABI = coreAddresses.getAbiForContract(openSTUtilityContractName)
  , openSTUtilityContractAddress = coreAddresses.getAddressForContract(openSTUtilityContractName)
  , BigNumber = require('bignumber.js')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , Config = require( process.argv[2] || coreConstants.OST_MEMBER_CONFIG_FILE_PATH )
  , readline = require('readline')
  , UC = "UtilityChain"
  , VC = "ValueChain"
;

var brandedToken = null
  , selectedMember = null
  , redeemerAddress = null
  , redeemerPassphrase = null
  , redeemerBtBalance = null
  , toRedeemAmount = null;

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
  return web3Provider.eth.net.getId()
    .then(function (networkId) {
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
  console.log("\x1b[34m Welcome to Un Staking And Redeeming Tool \x1b[0m");
  logger.step("Please choose utility token to redeem.");

  //List all available members.
  for (var i = 0; i < Config.Members.length; i++) {
    var member = Config.Members[i];
    console.log(i + 1, " for ", member.Name, "(", member.Symbol, ")");
  }

  return new Promise(function (resolve, reject) {
    readlineInterface.prompt();
    const rlCallback = function (line) {
      console.log("listAllMembers :: line", line);
      line = line.trim().toLowerCase();
      switch (line) {
        case "exit":
        case "bye":
          logger.log("Redeeming Aborted. Bye");
          process.exit(0);
          break;
      }
      var memberIndex = Number(line) - 1;
      console.log("Choosing utility token : ", memberIndex);
      if (isNaN(memberIndex) || memberIndex >= Config.Members.length) {
        console.log("\n");
        logger.error("Invalid Option. Please try again.");
        console.log("\n");
        return;
      }
      console.log(rlCallback);
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
  console.log("\x1b[34m Are you sure you would like to continue with Unstaking And Redeeming ? Options:\x1b[0m");
  console.log("\x1b[32m yes \x1b[0m\t", "To continue with Unstaking And Redeeming");
  console.log("\x1b[31m no \x1b[0m\t", "To quit the program");
  return new Promise(function (resolve, reject) {
    readlineInterface.prompt();
    const rlCallback = function (line) {
      console.log("confirmMember :: confirmToken :: line", line);
      line = line.trim().toLowerCase();
      switch (line) {
        case "yes":
        case "y":
          readlineInterface.removeListener("line", rlCallback);
          selectedMember = member;
          brandedToken = new brandedTokenKlass(selectedMember);
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
 * Ask redeemer address
 *
 * @return {Promise}
 */
const askRedeemerAddress = function () {
  return new Promise(function (resolve, reject) {
    console.log("Please mention the address of the redeemer.");
    readlineInterface.prompt();
    const rlCallback = function (line) {
      console.log("askRedeemerAddress :: readlineInterface :: line", line);
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
    console.log("Please mention the passphrase of the redeemer.");
    readlineInterface.prompt();
    const rlCallback = function (line) {
      console.log("askRedeemerAddress :: readlineInterface :: line", line);
      line = line.trim();

      const passphrase = line;

      readlineInterface.removeListener("line", rlCallback);
      redeemerPassphrase = passphrase;
      resolve(passphrase);
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
const getRedeemerBTBalance = function (redeemer) {
  return brandedToken.getBalanceOf(redeemer).then(
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
    console.log("Please mention the number of branded tokens to redeem.");
    readlineInterface.prompt();
    const rlCallback = function (line) {
      console.log("askRedeemingAmount :: readlineInterface :: line", line);
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
      const bigNumRedeemingAmount = new BigNumber(line);
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
        , needsApproval = (bigNumAllowance != toStakeAmount);

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

const getNonceForRedeeming = function () {
};

const redeem = function () {
};

const listenToRedemptionIntentConfirmed = function () {
};

const processRedeeming = function () {
};

const processUnstaking = function () {
};

/**
 * Perform stake and mint for branded token
 */
(function () {
  describeValueChain
    .then(describeUtilityChain)
    .then(listAllTokens)
    .then(confirmToken)
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
      reason && console.log(reason);
      process.exit(1);
    })
  ;
})();