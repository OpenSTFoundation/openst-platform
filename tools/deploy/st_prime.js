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
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , web3Provider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , OpenStUtilityKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
  , StPrimeKlass = require(rootPrefix + '/lib/contract_interact/st_prime')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

const utilityDeployerName = 'utilityDeployer'
  , openSTUtilityContractName = 'openSTUtility'
  , openSTUtilityContractAddress = coreAddresses.getAddressForContract(openSTUtilityContractName)
  , UC_GAS_PRICE = coreConstants.OST_UTILITY_GAS_PRICE_FOR_DEPLOYMENT
  , UC_GAS_LIMIT = coreConstants.OST_UTILITY_GAS_LIMIT
  , stPrimeTotalSupplyInWei = web3Provider.utils.toWei(coreConstants.OST_UTILITY_STPRIME_TOTAL_SUPPLY, "ether")
  , openStUtility = new OpenStUtilityKlass(openSTUtilityContractAddress)
;

/**
 * Constructor for ST Prime related deployment steps
 *
 * @constructor
 */
const STPrimeContractKlass = function () {};

STPrimeContractKlass.prototype = {
  /**
   * Perform
   *
   * @return {promise<result>}
   */
  perform: async function () {
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

    logger.step('** Initialize Transfer of ST Prime - all base tokens from deployer address to ST Prime contract address');
    const deployerSTPrimeBalanceInWei = await web3Provider.eth.getBalance(
      coreAddresses.getAddressForUser(utilityDeployerName));

    if (deployerSTPrimeBalanceInWei != stPrimeTotalSupplyInWei) {
      logger.error('Deployer - ' + utilityDeployerName + ' doesn\'t have max total supply of ST Prime');
      process.exit(1);
    }

    const stPrime = new StPrimeKlass(simpleTokenPrimeContractAddress);
    await stPrime.initialTransferToContract(utilityDeployerName, {gasPrice: UC_GAS_PRICE, gas: UC_GAS_LIMIT});

    const simpleTokenPrimeContractBalanceInWei = await web3Provider.eth.getBalance(simpleTokenPrimeContractAddress);

    if (simpleTokenPrimeContractBalanceInWei != stPrimeTotalSupplyInWei) {
      logger.error('simpleTokenPrimeContract: ' + simpleTokenPrimeContractAddress + ' doesn\'t have max total supply of ST Prime');
      process.exit(1);
    }

    const deployerBalanceInWeiAfterTransfer = await web3Provider.eth.getBalance(coreAddresses.getAddressForUser(utilityDeployerName));
    if (deployerBalanceInWeiAfterTransfer != 0) {
      logger.error('Deployer balance should be 0 after transfer');
      process.exit(1);
    }

    return Promise.resolve(responseHelper.successWithData(
      {contract: 'stPrime', address: simpleTokenPrimeContractAddress, uuid: simpleTokenPrimeUUID}));
  }
};

module.exports = new STPrimeContractKlass();