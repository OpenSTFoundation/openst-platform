'use strict';

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

const openSTNotification = require('@openstfoundation/openst-notification');

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  basicHelper = require(rootPrefix + '/helpers/basic_helper'),
  IntercomBaseKlass = require(rootPrefix + '/services/inter_comm/base');

require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/lib/contract_interact/value_registrar');
require(rootPrefix + '/lib/contract_interact/utility_registrar');

/**
 * Inter comm process to register branded token.
 *
 * @constructor
 *
 */
const RegisterBrandedTokenInterComm = function(params) {
  const oThis = this;

  IntercomBaseKlass.call(oThis, params);
};

RegisterBrandedTokenInterComm.prototype = Object.create(IntercomBaseKlass.prototype);

const RegisterBrandedTokenInterCommSpecificPrototype = {
  EVENT_NAME: 'ProposedBrandedToken',

  /**
   * Set contract object for listening to events
   *
   */
  setContractObj: function() {
    const oThis = this,
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      coreAddresses = oThis.ic().getCoreAddresses(),
      web3WsProvider = web3ProviderFactory.getProvider('utility', 'ws');

    oThis.completeContract = new web3WsProvider.eth.Contract(
      coreAddresses.getAbiForContract('openSTUtility'),
      coreAddresses.getAddressForContract('openSTUtility')
    );
    //oThis.completeContract.setProvider(web3WsProvider.currentProvider);
  },

  /**
   * Get chain highest block
   *
   */
  getChainHighestBlock: async function() {
    const oThis = this,
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3WsProvider = web3ProviderFactory.getProvider('utility', 'ws'),
      highestBlock = await web3WsProvider.eth.getBlockNumber();
    return highestBlock;
  },

  /**
   * Parallel processing allowed
   * @return bool
   */
  parallelProcessingAllowed: function() {
    return true;
  },

  /**
   * Process event object
   * @param {object} eventObj - event object
   */
  processEventObj: async function(eventObj) {
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      coreConstants = oThis.ic().getCoreConstants(),
      web3EventsFormatter = require(rootPrefix + '/lib/web3/events/formatter'),
      ValueRegistrarKlass = oThis.ic().getValueRegistrarInteractClass(),
      UtilityRegistrarKlass = oThis.ic().getUtilityRegistrarClass(),
      notificationData = {
        topics: ['event.register_branded_token'], // override later: with every stage
        publisher: 'OST',
        message: {
          kind: '', // populate later: with every stage
          payload: {}
        }
      };

    const valueRegistrarContractInteract = new ValueRegistrarKlass(
        coreAddresses.getAddressForContract('valueRegistrar')
      ),
      utilityRegistrarContractInteract = new UtilityRegistrarKlass(
        coreAddresses.getAddressForContract('utilityRegistrar')
      );

    const returnValues = eventObj.returnValues,
      symbol = returnValues._symbol,
      name = returnValues._name,
      conversionRate = returnValues._conversionRate,
      conversionRateDecimals = returnValues._conversionRateDecimals,
      requester = returnValues._requester,
      token = returnValues._token,
      uuid = returnValues._uuid;

    // Fire notification event
    notificationData.topics = ['event.register_branded_token.register_on_uc.start'];
    notificationData.message.kind = 'info';
    openSTNotification.publishEvent.perform(notificationData);

    logger.step(uuid, ':: performing registerBrandedToken of utilityRegistrar contract.');

    const ucRegistrarResponse = await utilityRegistrarContractInteract.registerBrandedToken(
      coreAddresses.getAddressForUser('utilityRegistrar'),
      coreAddresses.getPassphraseForUser('utilityRegistrar'),
      coreAddresses.getAddressForContract('openSTUtility'),
      symbol,
      name,
      conversionRate,
      conversionRateDecimals,
      requester,
      token,
      uuid
    );

    if (ucRegistrarResponse.isSuccess()) {
      const ucFormattedTransactionReceipt = ucRegistrarResponse.data.formattedTransactionReceipt,
        ucFormattedEvents = await web3EventsFormatter.perform(ucFormattedTransactionReceipt);

      // Fire notification event
      notificationData.topics = ['event.register_branded_token.register_on_uc.done'];
      notificationData.message.kind = 'info';
      notificationData.message.payload.transaction_hash = ucFormattedTransactionReceipt.transactionHash;
      openSTNotification.publishEvent.perform(notificationData);

      logger.win(
        uuid,
        ':: performed registerBrandedToken of utilityRegistrar contract.\n, ' +
          'Formatted events from the transaction receipt:\n',
        ucFormattedEvents
      );
    } else {
      // Fire notification event
      notificationData.message.kind = 'error';
      notificationData.message.payload.error_data = ucRegistrarResponse;
      openSTNotification.publishEvent.perform(notificationData);

      var errMessage = uuid + ' registerBrandedToken of utilityRegistrar contract ERROR. Something went wrong!';
      logger.notify('e_ic_rbt_processor_1', errMessage);

      let errObj = responseHelper.error({
        internal_error_identifier: 'e_ic_rbt_1_' + uuid,
        api_error_identifier: 'register_branded_token_transaction_error',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }

    // Fire notification event
    notificationData.topics = ['event.register_branded_token.register_on_vc.start'];
    notificationData.message.kind = 'info';
    openSTNotification.publishEvent.perform(notificationData);

    logger.step(uuid, ':: performing registerUtilityToken of valueRegistrar contract.');

    const vcRegistrarResponse = await valueRegistrarContractInteract.registerUtilityToken(
      coreAddresses.getAddressForUser('valueRegistrar'),
      coreAddresses.getPassphraseForUser('valueRegistrar'),
      coreAddresses.getAddressForContract('openSTValue'),
      symbol,
      name,
      conversionRate,
      conversionRateDecimals,
      coreConstants.OST_UTILITY_CHAIN_ID,
      requester,
      uuid
    );

    if (vcRegistrarResponse.isSuccess()) {
      const vcFormattedTransactionReceipt = vcRegistrarResponse.data.formattedTransactionReceipt,
        vcFormattedEvents = await web3EventsFormatter.perform(vcFormattedTransactionReceipt);

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

      let errObj = responseHelper.error({
        internal_error_identifier: 'e_ic_rbt_2_' + uuid,
        api_error_identifier: 'register_utility_token_transaction_error',
        error_config: basicHelper.fetchErrorConfig()
      });

      return Promise.resolve(errObj);
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }
};

Object.assign(RegisterBrandedTokenInterComm.prototype, RegisterBrandedTokenInterCommSpecificPrototype);

InstanceComposer.registerShadowableClass(RegisterBrandedTokenInterComm, 'getRegisterBrandedTokenInterCommService');

module.exports = RegisterBrandedTokenInterComm;
