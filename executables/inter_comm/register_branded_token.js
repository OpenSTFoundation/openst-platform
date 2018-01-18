"use strict";

/**
 * This script is intermediate communicator between value chain and utility chain. Used for the register branded token process.
 * This assumes that every propose should be followed by register.
 *
 * <br>It listens to the ProposedBrandedToken event of openSTUtility contract on value chain.
 * <br>
 *
 * <br><br>Following are the steps which are performed in here:
 * <ol>
 *   <li> Set the processor on {@link module:lib/web3/events/queue_manager} </li>
 *   <li> It waits for the event ProposedBrandedToken Raised by proposeBrandedToken method called on openSTUtility contract. </li>
 *   <li> On the event arrival it initiate a task in the internal queue to run it with 6 blocks delay. </li>
 *   <li> When the task executes it run the processor passed on step1. </li>
 * </ol>
 *
 * @module executables/inter_comm/register_branded_token
 *
 */

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , eventQueueManagerKlass = require(rootPrefix + '/lib/web3/events/queue_manager')
  , web3WsProvider = require(rootPrefix + '/lib/web3/providers/utility_ws')
  , web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter')
  , valueRegistrarContractInteractKlass = require(rootPrefix + '/lib/contract_interact/value_registrar')
  , utilityRegistrarContractInteractKlass = require(rootPrefix + '/lib/contract_interact/utility_registrar')

  , openSTValueContractAddr = coreAddresses.getAddressForContract('openSTValue')

  , openSTUtilityContractAbi = coreAddresses.getAbiForContract('openSTUtility')
  , openSTUtilityContractAddr = coreAddresses.getAddressForContract('openSTUtility')

  , valueRegistrarContractAddress = coreAddresses.getAddressForContract("valueRegistrar")
  , valueRegistrarContractInteract = new valueRegistrarContractInteractKlass(valueRegistrarContractAddress)

  , utilityRegistrarContractAddress = coreAddresses.getAddressForContract("utilityRegistrar")
  , utilityRegistrarContractInteract = new utilityRegistrarContractInteractKlass(utilityRegistrarContractAddress)

  , utilityRegistrarAddress = coreAddresses.getAddressForUser('utilityRegistrar')
  , utilityRegistrarPassphrase = coreAddresses.getPassphraseForUser('utilityRegistrar')

  , valueRegistrarAddress = coreAddresses.getAddressForUser('valueRegistrar')
  , valueRegistrarPassphrase = coreAddresses.getPassphraseForUser('valueRegistrar')

  , eventQueueManager = new eventQueueManagerKlass()
  , utilityChainId = coreConstants.OST_UTILITY_CHAIN_ID
;

const registerBrandedTokenInterComm = function () {
};


/**
 * Inter comm process for the stake and mint.
 * @namespace registerBrandedTokenInterComm
 */
registerBrandedTokenInterComm.prototype = {

  /**
   * Starts the process of the script with initializing processor
   * @memberOf registerBrandedTokenInterComm
   */
  init: function () {
    var oThis = this;

    eventQueueManager.setProcessor(oThis.processor);
    oThis.bindEvents();
  },

  /**
   *
   * Bind to start listening the event ProposedBrandedToken
   *
   */
  bindEvents: function () {
    var oThis = this;
    logger.log("bindEvents binding ProposedBrandedToken");

    oThis.listenToProposedBrandedToken(
      oThis.onEventSubscriptionError,
      oThis.onEvent,
      oThis.onEvent
    );

    logger.log("bindEvents done");
  },

  /**
   * Listening the event ProposedBrandedToken
   *
   * @param {function} onError - The method to run on error.
   * @param {function} onData - The method to run on success.
   * @param {function} onChange - The method to run on changed.
   *
   */
  listenToProposedBrandedToken: function (onError, onData, onChange) {
    var completeContract = new web3WsProvider.eth.Contract(openSTUtilityContractAbi, openSTUtilityContractAddr);
    completeContract.setProvider(web3WsProvider.currentProvider);

    completeContract.events.ProposedBrandedToken({})
      .on('error', onError)
      .on('data', onData)
      .on('changed', onChange);
  },

  /**
   * to be executed in {@link module:lib/web3/events/queue_manager} when ProposedBrandedToken succeed.
   *
   * @param {Object} eventObj - Object of event.
   *
   */
  onEvent: function (eventObj) {
    eventQueueManager.addEditEventInQueue(eventObj);
  },

  /**
   * Generic Method to log event subscription error
   *
   * @param {Object} error - Object of event.
   *
   */
  onEventSubscriptionError: function (error) {
    logger.log("onEventSubscriptionError triggered");
    logger.error(error);
  },

  /**
   * Processor to be executed in {@link module:lib/web3/events/queue_manager} when ProposedBrandedToken succeed.
   *
   * @param {Object} eventObj - Object of event.
   *
   */
  processor: async function (eventObj) {
    const oThis = this
      , returnValues = eventObj.returnValues
      , symbol = returnValues._symbol
      , name = returnValues._name
      , conversionRate = returnValues._conversionRate
      , requester = returnValues._requester
      , token = returnValues._token
      , uuid = returnValues._uuid;

    logger.step('Calling registerBrandedToken of utilityRegistrar contract.');

    const ucRegistrarResponse = await utilityRegistrarContractInteract.registerBrandedToken(
      utilityRegistrarAddress,
      utilityRegistrarPassphrase,
      openSTUtilityContractAddr,
      symbol,
      name,
      conversionRate,
      requester,
      token,
      uuid
    );

    logger.log(JSON.stringify(ucRegistrarResponse));

    if (ucRegistrarResponse.isSuccess()) {
      const ucFormattedTransactionReceipt = ucRegistrarResponse.data.formattedTransactionReceipt;
      const ucFormattedEvents = await web3EventsFormatter.perform(ucFormattedTransactionReceipt);

      if (!(ucFormattedEvents['RegisteredBrandedToken'])) {
        logger.error('RegisteredBrandedToken event not found in receipt. Something went wrong!');
        return Promise.reject('RegisteredBrandedToken event not found in receipt. Something went wrong!');
      } else {
        logger.win('registerBrandedToken of utilityRegistrar contract DONE.');
      }
    } else {
      logger.error('registerBrandedToken of utilityRegistrar contract ERROR. Something went wrong!');
    }


    logger.step('Calling registerUtilityToken of valueRegistrar contract.');

    const vcRegistrarResponse = await valueRegistrarContractInteract.registerUtilityToken(
      valueRegistrarAddress,
      valueRegistrarPassphrase,
      openSTValueContractAddr,
      symbol,
      name,
      conversionRate,
      utilityChainId,
      requester,
      uuid
    );

    logger.log(JSON.stringify(vcRegistrarResponse));

    if (vcRegistrarResponse.isSuccess()) {
      const vcFormattedTransactionReceipt = vcRegistrarResponse.data.formattedTransactionReceipt;
      const vcFormattedEvents = await web3EventsFormatter.perform(vcFormattedTransactionReceipt);

      if (!(vcFormattedEvents['UtilityTokenRegistered'])) {
        logger.error('UtilityTokenRegistered event not found in receipt. Something went wrong!');
        return Promise.reject('UtilityTokenRegistered event not found in receipt. Something went wrong!');
      } else {
        logger.win('registerUtilityToken of valueRegistrar contract DONE.');
      }
    } else {
      logger.error('registerUtilityToken of valueRegistrar contract ERROR. Something went wrong!');
    }

    return Promise.resolve(vcRegistrarResponse)

  }

};

new registerBrandedTokenInterComm().init();

logger.win("InterComm Script for Register Branded Token initiated");
