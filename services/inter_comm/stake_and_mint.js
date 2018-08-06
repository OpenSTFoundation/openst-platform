'use strict';

/**
 * This service is intermediate communicator between value chain and utility chain used for the stake and mint.
 *
 * <br>It listens to the StakingIntentDeclared event emitted by stake method of openSTValue contract.
 * On getting this event, it calls confirmStakingIntent method of utilityRegistrar contract.
 *
 * <br><br>Following are the steps which are performed in here:
 * <ol>
 *   <li> It scans for StakingIntentDeclared event in the blocks which were not scanned until now till the latest
 *   block minus 6th block.</li>
 *   <li> When events are obtained, it processes the events one by one, in which confirmStakingIntent method of
 *   utilityRegistrar contract is called. When processing a single event from the array of events, it waits for the moment till
 *   transaction hash is obtained and then picks the next event for processing.</li>
 * </ol>
 *
 * @module services/inter_comm/stake_and_mint
 */

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  IntercomBaseKlass = require(rootPrefix + '/services/inter_comm/base');

require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/lib/contract_interact/utility_registrar');

/**
 * Inter comm process for the stake and mint.
 *
 * @param {string} params.file_path - this is the file path for the data file
 *
 * @constructor
 * @augments IntercomBaseKlass
 *
 */
const StakeAndMintInterCommKlass = function(params) {
  const oThis = this;

  IntercomBaseKlass.call(oThis, params);
};

StakeAndMintInterCommKlass.prototype = Object.create(IntercomBaseKlass.prototype);

const StakeAndMintInterCommKlassSpecificPrototype = {
  EVENT_NAME: 'StakingIntentDeclared',

  /**
   * Set contract object for listening to events
   *
   */
  setContractObj: function() {
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3WsProvider = web3ProviderFactory.getProvider('value', 'ws'),
      openSTValueContractAbi = coreAddresses.getAbiForContract('openSTValue'),
      openSTValueContractAddr = coreAddresses.getAddressForContract('openSTValue');

    oThis.completeContract = new web3WsProvider.eth.Contract(openSTValueContractAbi, openSTValueContractAddr);
  },

  /**
   * Get chain highest block
   *
   */
  getChainHighestBlock: async function() {
    const oThis = this,
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3WsProvider = web3ProviderFactory.getProvider('value', 'ws');

    return await web3WsProvider.eth.getBlockNumber();
  },

  /**
   * Parallel processing allowed
   * @return bool
   */
  parallelProcessingAllowed: function() {
    return false;
  },

  /**
   * Process event object
   * @param {object} eventObj - event object
   */
  processEventObj: async function(eventObj) {
    console.log('eventObj', eventObj);
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      UtilityRegistrarKlass = oThis.ic().getUtilityRegistrarClass(),
      returnValues = eventObj.returnValues,
      uuid = returnValues._uuid,
      staker = returnValues._staker,
      stakerNonce = returnValues._stakerNonce,
      amountST = returnValues._amountST,
      amountUT = returnValues._amountUT,
      unlockHeight = returnValues._unlockHeight,
      stakingIntentHash = returnValues._stakingIntentHash,
      beneficiary = returnValues._beneficiary,
      chainIdUtility = returnValues._chainIdUtility,
      utilityRegistrarContractAddress = coreAddresses.getAddressForContract('utilityRegistrar'),
      openSTUtilityCurrContractAddr = coreAddresses.getAddressForContract('openSTUtility'),
      utilityRegistrarAddr = coreAddresses.getAddressForUser('utilityRegistrar'),
      utilityRegistrarPassphrase = coreAddresses.getPassphraseForUser('utilityRegistrar'),
      utilityRegistrarContractInteract = new UtilityRegistrarKlass(utilityRegistrarContractAddress);

    const transactionHash = await utilityRegistrarContractInteract.confirmStakingIntent(
      utilityRegistrarAddr,
      utilityRegistrarPassphrase,
      openSTUtilityCurrContractAddr,
      uuid,
      staker,
      stakerNonce,
      beneficiary,
      amountST,
      amountUT,
      unlockHeight,
      stakingIntentHash,
      true
    );

    logger.info(stakingIntentHash, ':: transaction hash for confirmStakingIntent:', transactionHash);

    return Promise.resolve(responseHelper.successWithData({}));
  }
};

Object.assign(StakeAndMintInterCommKlass.prototype, StakeAndMintInterCommKlassSpecificPrototype);

InstanceComposer.registerShadowableClass(StakeAndMintInterCommKlass, 'getStakeAndMintInterCommService');

module.exports = StakeAndMintInterCommKlass;
