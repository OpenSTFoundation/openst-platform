"use strict";

/**
 * This service is intermediate communicator between value chain and utility chain used for the registering branded token.
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
 * @module services/inter_comm/register_branded_token
 */

const openSTNotification = require('@openstfoundation/openst-notification')
;

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , IntercomBaseKlass = require(rootPrefix + '/services/inter_comm/base')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
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
  , notificationData = {
    topics: ['event.register_branded_token'], // override later: with every stage
    publisher: 'OST',
    message: {
      kind: '', // populate later: with every stage
      payload: {}
    }
  }
;

/**
 * Inter comm process to register branded token.
 *
 * @constructor
 *
 */
const RegisterBrandedTokenInterComm = function (params) {
  const oThis = this
  ;

  IntercomBaseKlass.call(oThis, params);
};

RegisterBrandedTokenInterComm.prototype = Object.create(IntercomBaseKlass.prototype);

const RegisterBrandedTokenInterCommSpecificPrototype = {

  EVENT_NAME: 'ProposedBrandedToken',

  /**
   * Set contract object for listening to events
   *
   */
  setContractObj: function () {
    const oThis = this
      , web3WsProvider = require(rootPrefix + '/lib/web3/providers/utility_ws')
    ;

    oThis.completeContract = new web3WsProvider.eth.Contract(openSTUtilityContractAbi, openSTUtilityContractAddr);
    //oThis.completeContract.setProvider(web3WsProvider.currentProvider);
  },

  /**
   * Get chain highest block
   *
   */
  getChainHighestBlock: async function () {
    const web3WsProvider = require(rootPrefix + '/lib/web3/providers/utility_ws')
      , highestBlock = await web3WsProvider.eth.getBlockNumber()
    ;
    return highestBlock;
  },

  /**
   * Parallel processing allowed
   * @return bool
   */
  parallelProcessingAllowed: function () {
    return true;
  },

  /**
   * Process event object
   * @param {object} eventObj - event object
   */
  processEventObj: async function (eventObj) {
    const web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter')
      , ValueRegistrarKlass = require(rootPrefix + '/lib/contract_interact/value_registrar')
      , UtilityRegistrarKlass = require(rootPrefix + '/lib/contract_interact/utility_registrar')
    ;

    const valueRegistrarContractInteract = new ValueRegistrarKlass(valueRegistrarContractAddr)
      , utilityRegistrarContractInteract = new UtilityRegistrarKlass(utilityRegistrarContractAddr)
    ;

    const oThis = this
      , returnValues = eventObj.returnValues
      , symbol = returnValues._symbol
      , name = returnValues._name
      , conversionRate = returnValues._conversionRate
      , conversionRateDecimals = returnValues._conversionRateDecimals
      , requester = returnValues._requester
      , token = returnValues._token
      , uuid = returnValues._uuid;

    // Fire notification event
    notificationData.topics = ['event.register_branded_token.register_on_uc.start'];
    notificationData.message.kind = 'info';
    openSTNotification.publishEvent.perform(notificationData);

    logger.step(uuid, ':: performing registerBrandedToken of utilityRegistrar contract.');

    const ucRegistrarResponse = await utilityRegistrarContractInteract.registerBrandedToken(
      utilityRegistrarAddr,
      utilityRegistrarPassphrase,
      openSTUtilityContractAddr,
      symbol,
      name,
      conversionRate,
      conversionRateDecimals,
      requester,
      token,
      uuid
    );

    if (ucRegistrarResponse.isSuccess()) {
      const ucFormattedTransactionReceipt = ucRegistrarResponse.data.formattedTransactionReceipt
        , ucFormattedEvents = await web3EventsFormatter.perform(ucFormattedTransactionReceipt);

      // Fire notification event
      notificationData.topics = ['event.register_branded_token.register_on_uc.done'];
      notificationData.message.kind = 'info';
      notificationData.message.payload.transaction_hash = ucFormattedTransactionReceipt.transactionHash;
      openSTNotification.publishEvent.perform(notificationData);

      logger.win(uuid, ':: performed registerBrandedToken of utilityRegistrar contract.', ucFormattedEvents);
    } else {

      // Fire notification event
      notificationData.message.kind = 'error';
      notificationData.message.payload.error_data = ucRegistrarResponse;
      openSTNotification.publishEvent.perform(notificationData);

      var errMessage = uuid + ' registerBrandedToken of utilityRegistrar contract ERROR. Something went wrong!';
      logger.notify('e_ic_rbt_processor_1', errMessage);

      return Promise.resolve(responseHelper.error('e_ic_rbt_1', errMessage));
    }

    // Fire notification event
    notificationData.topics = ['event.register_branded_token.register_on_vc.start'];
    notificationData.message.kind = 'info';
    openSTNotification.publishEvent.perform(notificationData);

    logger.step(uuid, ':: performing registerUtilityToken of valueRegistrar contract.');

    const vcRegistrarResponse = await valueRegistrarContractInteract.registerUtilityToken(
      valueRegistrarAddr,
      valueRegistrarPassphrase,
      openSTValueContractAddr,
      symbol,
      name,
      conversionRate,
      conversionRateDecimals,
      utilityChainId,
      requester,
      uuid
    );

    if (vcRegistrarResponse.isSuccess()) {
      const vcFormattedTransactionReceipt = vcRegistrarResponse.data.formattedTransactionReceipt
        , vcFormattedEvents = await web3EventsFormatter.perform(vcFormattedTransactionReceipt);

      // Fire notification event
      notificationData.topics = ['event.register_branded_token.register_on_vc.done'];
      notificationData.message.kind = 'info';
      notificationData.message.payload.transaction_hash = vcFormattedTransactionReceipt.transactionHash;
      openSTNotification.publishEvent.perform(notificationData);

      logger.win(uuid, ':: performed registerUtilityToken of valueRegistrar contract.', vcFormattedEvents);
    } else {

      // Fire notification event
      notificationData.message.kind = 'error';
      notificationData.message.payload.error_data = vcRegistrarResponse;
      openSTNotification.publishEvent.perform(notificationData);

      var errMessage = uuid + ' registerUtilityToken of valueRegistrar contract ERROR. Something went wrong!';
      logger.notify('e_ic_rbt_processor_2', errMessage);

      return Promise.resolve(responseHelper.error('e_ic_rbt_2', errMessage));
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }
};

Object.assign(RegisterBrandedTokenInterComm.prototype, RegisterBrandedTokenInterCommSpecificPrototype);

module.exports = RegisterBrandedTokenInterComm;