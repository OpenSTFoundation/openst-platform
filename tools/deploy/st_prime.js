"use strict";
/**
 * ST Prime related deployment steps
 *
 * <br><br>Following are the steps which are performed in here:
 * <ol>
 *   <li> Getting UUID of ST prime contract from openSTUtility Contract.</li>
 *   <li> Getting address of ST prime contract from openSTUtility Contract.</li>
 *   <li> Checking if ST prime contract was deployed correctly at the address obtained.</li>
 *   <li> Initialize Transfer of ST Prime - all base tokens from deployer address to ST Prime contract address.</li>
 * </ol>
 *
 * @module tools/deploy/st_prime
 */

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , InstanceComposer = require( rootPrefix + "/instance_composer")
;

require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/web3/providers/factory');
require(rootPrefix + '/lib/contract_interact/openst_utility');
require(rootPrefix + '/lib/contract_interact/st_prime');

/**
 * Constructor for ST Prime related deployment steps
 *
 * @constructor
 */
const STPrimeContractKlass = function ( configStrategy, instanceComposer) {

};

STPrimeContractKlass.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function () {
    
    const oThis = this
      , coreConstants = oThis.ic().getCoreConstants()
      , coreAddresses = oThis.ic().getCoreAddresses()
      , web3ProviderFactory = oThis.ic().getWeb3ProviderFactory()
      , OpenStUtilityKlass = oThis.ic().getOpenSTUtilityeInteractClass()
      , StPrimeKlass = oThis.ic().getStPrimeInteractClass()
      , utilityInitialSTPrimeHolder = 'utilityInitialSTPrimeHolder'
      , openSTUtilityContractName = 'openSTUtility'
      , openSTUtilityContractAddress = coreAddresses.getAddressForContract(openSTUtilityContractName)
      , UC_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE_FOR_DEPLOYMENT
      , UC_GAS_LIMIT = coreConstants.OST_UTILITY_GAS_LIMIT
      , web3Provider = web3ProviderFactory.getProvider('utility', web3ProviderFactory.typeWS)
      , stPrimeTotalSupplyInWei = web3Provider.utils.toWei(coreConstants.OST_UTILITY_STPRIME_TOTAL_SUPPLY, "ether")
      , openStUtility = new OpenStUtilityKlass(openSTUtilityContractAddress)
    ;
    
    logger.step('** Getting UUID of ST prime contract from openSTUtility Contract');
    const stPrimeUUIDResponse = await openStUtility.getSimpleTokenPrimeUUID()
      , simpleTokenPrimeUUID = stPrimeUUIDResponse.data.simpleTokenPrimeUUID
    ;

    if (simpleTokenPrimeUUID.length <= 2) {
      logger.error('Exiting the deployment as simpleTokenPrimeUUID has invalid length');
      process.exit(1);
    }

    logger.step('** Getting address of ST prime contract from openSTUtility Contract');
    const getSimpleTokenPrimeContractAddressResponse = await openStUtility.getSimpleTokenPrimeContractAddress()
      , simpleTokenPrimeContractAddress = getSimpleTokenPrimeContractAddressResponse.data.simpleTokenPrimeContractAddress;

    logger.step('** Checking if ST prime contract was deployed correctly at the address obtained');
    const code = await web3Provider.eth.getCode(simpleTokenPrimeContractAddress);
    if (code.length <= 2) {
      logger.error('Contract deployment failed. Invalid code length for contract: simpleTokenPrime');
      process.exit(1);
    }

    logger.step('** Initialize Transfer of ST Prime - all base tokens from initial ST Prime holder address to ST Prime contract address');
    const initialSTPrimeHolderBalanceInWei = await web3Provider.eth.getBalance(
      coreAddresses.getAddressForUser(utilityInitialSTPrimeHolder));

    if (initialSTPrimeHolderBalanceInWei != stPrimeTotalSupplyInWei) {
      logger.error('Initial ST Prime holder - ' + utilityInitialSTPrimeHolder + ' doesn\'t have max total supply of ST Prime');
      process.exit(1);
    }

    const stPrime = new StPrimeKlass(simpleTokenPrimeContractAddress);
    await stPrime.initialTransferToContract(utilityInitialSTPrimeHolder, {gasPrice: UC_GAS_PRICE, gas: UC_GAS_LIMIT});

    const simpleTokenPrimeContractBalanceInWei = await web3Provider.eth.getBalance(simpleTokenPrimeContractAddress);

    if (simpleTokenPrimeContractBalanceInWei != stPrimeTotalSupplyInWei) {
      logger.error('simpleTokenPrimeContract: ' + simpleTokenPrimeContractAddress + ' doesn\'t have max total supply of ST Prime');
      process.exit(1);
    }

    const initialSTPrimeHolderBalanceInWeiAfterTransfer = await web3Provider.eth.getBalance(coreAddresses.getAddressForUser(utilityInitialSTPrimeHolder));
    if (initialSTPrimeHolderBalanceInWeiAfterTransfer != 0) {
      logger.error('Initial ST Prime holder balance should be 0 after transfer');
      process.exit(1);
    }

    return Promise.resolve(responseHelper.successWithData(
      {contract: 'stPrime', address: simpleTokenPrimeContractAddress, uuid: simpleTokenPrimeUUID}));
  }
};

InstanceComposer.register(STPrimeContractKlass, "getSTPrimeDeployer", true);

module.exports = STPrimeContractKlass;