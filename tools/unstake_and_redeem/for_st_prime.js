"use strict";

const BigNumber = require('bignumber.js')
  , readline = require('readline')
;

const rootPrefix = '../..'
  , web3UtilityRpcProvider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , web3ValueWsProvider = require(rootPrefix + '/lib/web3/providers/value_ws')
  , web3UtilityWsProvider = require(rootPrefix + '/lib/web3/providers/utility_ws')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , openSTValueContractInteractKlass = require(rootPrefix + '/lib/contract_interact/openst_value')
  , openSTUtilityContractInteractKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
;

const openSTValueContractName = 'openSTValue'
  , UC = "UtilityChain"
  , VC = "ValueChain"
  , openSTUtilityContractName = 'openSTUtility'
  , openSTValueContractABI = coreAddresses.getAbiForContract(openSTValueContractName)
  , openSTValueContractAddress = coreAddresses.getAddressForContract(openSTValueContractName)
  , openSTUtilityContractAddress = coreAddresses.getAddressForContract(openSTUtilityContractName)
  , openSTValueContractInteract = new openSTValueContractInteractKlass(openSTValueContractAddress)
  , openSTUtilityContractInteract = new openSTUtilityContractInteractKlass(openSTUtilityContractAddress)
;

var redeemerAddress       = null
  , redeemerPassphrase    = null
  , redeemerBtBalance     = null
  , toRedeemAmount        = null
  , redeemerNonce         = null
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
 * Get uuid of the token
 *
 * @return {Promise}
 */
const getUuid = async function () {};

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
const getRedeemerSTPrimeBalance = function () {};

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

const redeemSTPrime = async function () {};

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
    .then(getUuid)
    .then(askRedeemerAddress)
    .then(askRedeemerPassphrase)
    .then(getRedeemerSTPrimeBalance)
    .then(askRedeemingAmount)
    .then(getNonceForRedeeming)
    .then(redeemSTPrime)
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