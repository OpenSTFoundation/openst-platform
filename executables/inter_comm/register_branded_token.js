"use strict";

/**
 * This executable / script is intermediate communicator between value chain and utility chain used for the registering branded token.
 *
 * <br>It listens to the ProposedBrandedToken event emitted by proposeBrandedToken method of openSTUtility contract.
 * On getting this event, it calls registerBrandedToken method of utilityRegistrar contract followed
 * by calling registerUtilityToken method of valueRegistrar contract.
 *
 * <br><br>Following are the steps which are performed in here:
 * <ol>
 *   <li> Set the processor on {@link module:lib/web3/events/queue_manager|queue manager} </li>
 *   <li> It waits for the event ProposedBrandedToken from openSTUtility contract. </li>
 *   <li> On the event arrival it initiate a task in the internal queue to run it with 6 blocks delay. </li>
 *   <li> When the task executes it run the processor passed on step1,
 *   in which it calls registerBrandedToken method of utilityRegistrar contract followed
 *   by calling registerUtilityToken method of valueRegistrar contract. </li>
 * </ol>
 *
 * @module executables/inter_comm/register_branded_token
 *
 */

const openSTNotification = require('@openstfoundation/openst-notification')
;

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , eventQueueManagerKlass = require(rootPrefix + '/lib/web3/events/queue_manager')
  , web3WsProvider = require(rootPrefix + '/lib/web3/providers/utility_ws')
  , web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter')
  , ValueRegistrarKlass = require(rootPrefix + '/lib/contract_interact/value_registrar')
  , UtilityRegistrarKlass = require(rootPrefix + '/lib/contract_interact/utility_registrar')
;

const openSTValueContractAddr = coreAddresses.getAddressForContract('openSTValue')
  , openSTUtilityContractAbi = coreAddresses.getAbiForContract('openSTUtility')
  , openSTUtilityContractAddr = coreAddresses.getAddressForContract('openSTUtility')
  , valueRegistrarContractAddr = coreAddresses.getAddressForContract("valueRegistrar")
  , utilityRegistrarContractAddr = coreAddresses.getAddressForContract("utilityRegistrar")
  , utilityRegistrarAddr = coreAddresses.getAddressForUser('utilityRegistrar')
  , utilityRegistrarPassphrase = coreAddresses.getPassphraseForUser('utilityRegistrar')
  , valueRegistrarAddr = coreAddresses.getAddressForUser('valueRegistrar')
  , valueRegistrarPassphrase = coreAddresses.getPassphraseForUser('valueRegistrar')
  , utilityChainId = coreConstants.OST_UTILITY_CHAIN_ID
  , valueRegistrarContractInteract = new ValueRegistrarKlass(valueRegistrarContractAddr)
  , utilityRegistrarContractInteract = new UtilityRegistrarKlass(utilityRegistrarContractAddr)
  , eventQueueManager = new eventQueueManagerKlass()
;

/**
 * Inter comm process to register branded token.
 *
 * @constructor
 *
 */
const RegisterBrandedTokenInterComm = function () {
};

RegisterBrandedTokenInterComm.prototype = {

  /**
   * Starts the process of the script with initializing processor
   *
   */
  init: function () {
    var oThis = this;

    eventQueueManager.setProcessor(oThis.processor);
    oThis.bindEvents();
  },

  /**
   * Bind to start listening the desired event
   *
   */
  bindEvents: function () {
    var oThis = this;
    logger.log("bindEvents binding ProposedBrandedToken");

    oThis.listenToDesiredEvent(
      oThis.onEventSubscriptionError,
      oThis.onEvent,
      oThis.onEvent
    );

    logger.log("bindEvents done");
  },

  /**
   * Listening ProposedBrandedToken event emitted by proposeBrandedToken method of openSTUtility contract.
   *
   * @param {function} onError - The method to run on error.
   * @param {function} onData - The method to run on success.
   * @param {function} onChange - The method to run on changed.
   *
   */
  listenToDesiredEvent: function (onError, onData, onChange) {
    var completeContract = new web3WsProvider.eth.Contract(openSTUtilityContractAbi, openSTUtilityContractAddr);
    completeContract.setProvider(web3WsProvider.currentProvider);

    completeContract.events.ProposedBrandedToken({})
      .on('error', onError)
      .on('data', onData)
      .on('changed', onChange);
  },

  /**
   * Processing of ProposedBrandedToken event is delayed for n block confirmation by enqueueing to
   * {@link module:lib/web3/events/queue_manager|queue manager}.
   *
   * @param {Object} eventObj - Object of event.
   *
   */
  onEvent: function (eventObj) {
    openSTNotification.publish_event.perform(
      {
        topic: 'event.ProposedBrandedToken',
        message: {
          kind: 'event_received',
          payload: {
            event_name: 'ProposedBrandedToken',
            params: eventObj.returnValues,
            contract_address: openSTUtilityContractAddr,
            chain_id: web3WsProvider.chainId,
            chain_kind: web3WsProvider.chainKind
          }
        }
      }
    );
    eventQueueManager.addEditEventInQueue(eventObj);
  },

  /**
   * Generic Method to log event subscription error
   *
   * @param {Object} error - Object of event.
   *
   */
  onEventSubscriptionError: function (error) {
    openSTNotification.publish_event.perform(
      {
        topic: 'error',
        message: {
          kind: 'error',
          payload: {
            text: error || '',
            code: 'e_ic_rbt_onEventSubscriptionError_1'
          }
        }
      }
    );

    logger.error('onEventSubscriptionError triggered');
    logger.error(error);
  },

  /**
   * Processor gets executed from {@link module:lib/web3/events/queue_manager|queue manager} for
   * every ProposedBrandedToken event after waiting for n block confirmation.
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

    openSTNotification.publish_event.perform(
      {
        topic: 'obBoarding.registerBrandedToken.start',
        message: {
          kind: 'info',
          payload: {
            uuid: uuid
          }
        }
      }
    );
    logger.step(uuid, ':: performing registerBrandedToken of utilityRegistrar contract.');

    const ucRegistrarResponse = await utilityRegistrarContractInteract.registerBrandedToken(
      utilityRegistrarAddr,
      utilityRegistrarPassphrase,
      openSTUtilityContractAddr,
      symbol,
      name,
      conversionRate,
      requester,
      token,
      uuid
    );

    if (ucRegistrarResponse.isSuccess()) {
      const ucFormattedTransactionReceipt = ucRegistrarResponse.data.formattedTransactionReceipt
        , ucFormattedEvents = await web3EventsFormatter.perform(ucFormattedTransactionReceipt);

      if (!(ucFormattedEvents['RegisteredBrandedToken'])) {
        var err = 'RegisteredBrandedToken event not found in receipt. Something went wrong!';
        logger.error(err);
        return Promise.reject(err);
      } else {
        openSTNotification.publish_event.perform(
          {
            topic: 'obBoarding.registerBrandedToken.done',
            message: {
              kind: 'info',
              payload: {
                uuid: uuid
              }
            }
          }
        );
        logger.win(uuid, ':: performed registerBrandedToken of utilityRegistrar contract.');
      }
    } else {
      var err = 'registerBrandedToken of utilityRegistrar contract ERROR. Something went wrong!';
      logger.error(err);
      return Promise.reject(err);
    }

    openSTNotification.publish_event.perform(
      {
        topic: 'obBoarding.registerUtilityToken.start',
        message: {
          kind: 'info',
          payload: {
            uuid: uuid
          }
        }
      }
    );
    logger.step(uuid, ':: performing registerUtilityToken of valueRegistrar contract.');

    const vcRegistrarResponse = await valueRegistrarContractInteract.registerUtilityToken(
      valueRegistrarAddr,
      valueRegistrarPassphrase,
      openSTValueContractAddr,
      symbol,
      name,
      conversionRate,
      utilityChainId,
      requester,
      uuid
    );

    if (vcRegistrarResponse.isSuccess()) {
      const vcFormattedTransactionReceipt = vcRegistrarResponse.data.formattedTransactionReceipt
        , vcFormattedEvents = await web3EventsFormatter.perform(vcFormattedTransactionReceipt);

      if (!(vcFormattedEvents['UtilityTokenRegistered'])) {
        var err = 'UtilityTokenRegistered event not found in receipt. Something went wrong!';
        logger.error(err);
        return Promise.reject(err);
      } else {
        openSTNotification.publish_event.perform(
          {
            topic: 'obBoarding.registerUtilityToken.done',
            message: {
              kind: 'info',
              payload: {
                uuid: uuid
              }
            }
          }
        );
        logger.win(uuid, ':: performed registerUtilityToken of valueRegistrar contract.');
      }
    } else {
      var err = 'registerUtilityToken of valueRegistrar contract ERROR. Something went wrong!';
      logger.error(err);
      return Promise.reject(err);
    }

    return Promise.resolve(vcRegistrarResponse)
  }
};

new RegisterBrandedTokenInterComm().init();

logger.win("InterComm Script for Register Branded Token initiated.");
