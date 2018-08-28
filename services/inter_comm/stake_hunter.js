"use strict";

/**
 * This service is intermediate communicator between value chain and utility chain used for
 * calling process staking if NOT called before process minting is called.
 *
 * <br>It listens to the ProcessedMint event emitted by processMinting method of openSTUtility contract.
 * On getting this event, it calls processStaking method of openSTValue contract if not called already.
 *
 * <br><br>Following are the steps which are performed in here:
 * <ol>
 *   <li> It scans for ProcessedMint event in the blocks which were not scanned until now till the latest
 *   block minus 6th block.</li>
 *   <li> When events are obtained, it processes the events one by one, in which processStaking method of
 *   openSTValue contract is called, if not called already. When processing a single event from the array of
 *   events, it waits for the moment till transaction hash is obtained and then picks the next event for processing.</li>
 * </ol>
 *
 * @module services/inter_comm/stake_hunter
 */

const rootPrefix = '../..'
  , InstanceComposer = require(rootPrefix + '/instance_composer')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , IntercomBaseKlass = require(rootPrefix + '/services/inter_comm/base')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , BigNumber = require('bignumber.js')
;

require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/lib/contract_interact/value_registrar');
require(rootPrefix + '/services/transaction/estimate_gas');

/**
 * Inter comm process for stake hunter.
 *
 * @param {string} params.file_path - this is the file path for the data file
 *
 * @constructor
 * @augments IntercomBaseKlass
 *
 */
const StakeHunterInterCommKlass = function (params) {
  const oThis = this
  ;

  IntercomBaseKlass.call(oThis, params);
};

StakeHunterInterCommKlass.prototype = Object.create(IntercomBaseKlass.prototype);

const StakeHunterInterCommKlassSpecificPrototype = {

  EVENT_NAME: 'ProcessedMint',

  // Process block after delay of BLOCK_CONFIRMATION.
  BLOCK_CONFIRMATION: 24,

  /**
   * Set contract object for listening to events
   */
  setContractObj: function () {

    const oThis = this
      , coreAddresses = oThis.ic().getCoreAddresses()
      , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
      , web3WsProvider = web3ProviderFactory.getProvider('utility', web3ProviderFactory.typeWS)
      , openSTUtilityContractAbi = coreAddresses.getAbiForContract('openSTUtility')
      , openSTUtilityContractAddr = coreAddresses.getAddressForContract('openSTUtility')
    ;

    oThis.completeContract = new web3WsProvider.eth.Contract(openSTUtilityContractAbi, openSTUtilityContractAddr);

  },

  /**
   * Get chain highest block
   *
   */
  getChainHighestBlock: async function () {
    const oThis = this,
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3WsProvider = web3ProviderFactory.getProvider('utility', web3ProviderFactory.typeWS);
    return web3WsProvider.eth.getBlockNumber();
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

    const oThis = this
      , coreConstants = oThis.ic().getCoreConstants()
      , coreAddresses = oThis.ic().getCoreAddresses()
      , ValueRegistrarKlass = oThis.ic().getValueRegistrarInteractClass()
      , EstimateGasKlass = oThis.ic().getEstimateGasService()
      , senderAddr = coreAddresses.getAddressForUser('valueRegistrar')
      , senderPassphrase = coreAddresses.getPassphraseForUser('valueRegistrar')
      , valueRegistrarContractAddress = coreAddresses.getAddressForContract('valueRegistrar')
      , openSTValueContractAddress = coreAddresses.getAddressForContract('openSTValue')
      , valueRegistrarContractInteract = new ValueRegistrarKlass(valueRegistrarContractAddress)
    ;

    const returnValues = eventObj.returnValues
      , stakingIntentHash = returnValues._stakingIntentHash
    ;

    // estimating gas for the transaction
    const estimateGasObj = new EstimateGasKlass({
      contract_name: 'valueRegistrar',
      contract_address: valueRegistrarContractAddress,
      chain: 'value',
      sender_address: senderAddr,
      method_name: 'processStaking',
      method_arguments: [openSTValueContractAddress, stakingIntentHash]
    });

    const estimateGasResponse = await estimateGasObj.perform()
      .then( function ( response ) {
        //We need to call processStaking.
        response.data.is_process_staking_called = false;
        return response;
      })
      .catch(function ( reason ) {

        if ( String( reason ).toLowerCase().indexOf("gas required exceeds allowance") > -1 ) {
          logger.win("Nothing to worry. This is the happy case for us.");
          return responseHelper.successWithData({
            gas_to_use: 0,
            is_process_staking_called: true
          })
        }
        //Assume Error.
        logger.error("IMPORTANT :: Stake Hunter became hunted. Please Check :: ", reason);
        return responseHelper.error({
          internal_error_identifier: 's_ic_h_nothing_to_do',
          api_error_identifier: 'something_went_wrong',
          error_config: basicHelper.fetchErrorConfig()
        });

      });

    if ( estimateGasResponse.isFailure() ) {
      //Sorry! We were hunted.
      return estimateGasResponse;
    } else if ( estimateGasResponse.data.is_process_staking_called ) {
      //Nothing to Hunt.
      return estimateGasResponse;
    }

    //Lets hunt it!.
    const gasToUse = estimateGasResponse.data.gas_to_use
      , VC_GAS_LIMIT = coreConstants.OST_VALUE_GAS_LIMIT
    ;

    if ((new BigNumber(gasToUse)).gte(new BigNumber(VC_GAS_LIMIT))) {
      let errObj = responseHelper.error({
        internal_error_identifier: 's_ic_h_1',
        api_error_identifier: 'something_went_wrong',
        error_config: basicHelper.fetchErrorConfig()
      });
      return Promise.resolve(errObj);
    }

    const vcStakeResponse = await valueRegistrarContractInteract.processStaking(senderAddr,
      senderPassphrase, stakingIntentHash);

    if (vcStakeResponse.isSuccess()) {
      logger.win(stakingIntentHash, ':: performed processStaking on valueRegistrar (which internally calls ' +
        'processStaking of openSTValue contract) contract for', returnValues);
    } else {
      logger.error(stakingIntentHash, ':: performed processStaking with error for', returnValues);
      return Promise.resolve(vcStakeResponse);
    }

    logger.win("I am Stake Hunter, do you want to see my gun ?");

    return Promise.resolve(responseHelper.successWithData({}));

  }

};

Object.assign(StakeHunterInterCommKlass.prototype, StakeHunterInterCommKlassSpecificPrototype);

InstanceComposer.registerShadowableClass(
  StakeHunterInterCommKlass,
  'getStakeHunterInterCommService'
);

module.exports = StakeHunterInterCommKlass;