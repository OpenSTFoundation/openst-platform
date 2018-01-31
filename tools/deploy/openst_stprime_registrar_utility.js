"use strict";

/**
 *
 * This is script for deploying registrar, openSTUtility contract on utility chain.<br><br>
 * It transfer all base tokens from deploer key to STPrime contract address. <br/><br/>
 *
 *   Prerequisite:
 *    <ol>
 *       <li>Deployer address on utility chain</li>
 *       <li>Deployer should have exactly 800M base tokens</li>
 *       <li>Utility Chain Owner User Address</li>
 *       <li>Registrar Address</li>
 *     </ol>
 *
 *   These are the following steps:<br>
 *     <ol>
 *       <li>In genesis.json alloc 800M base tokens to Deployer address</li>
 *       <li>Deploy Registrar contract</li>
 *       <li>Set ops address to registrar user address</li>
 *       <li>Initiate ownership transfer to Utility Chain Owner User Address</li>
 *       <li>Deploys openSTUtility contract. It auto deploys STPrime contract</li>
 *       <li>Initiate owner ship transfer of openSTUtility contract to Utility Chain Owner User Address</li>
 *       <li>Query openSTUtility contract to get STPrime Contract Address</li>
 *       <li>Query openSTUtility contract to get STPrime UUID</li>
 *       <li>Transfer 800M base tokens from machine key to STPrime contract address.</li>
 *     </ol>
 *
 *
 * @module tools/deploy/openst_utility
 *
 */

const rootPrefix = '../..'
  , readline = require('readline')
  , deployerName = 'utilityDeployer'
  , web3Provider = require(rootPrefix + '/lib/web3/providers/utility_rpc')
  , deployHelper = require('./helper')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , prompts = readline.createInterface(process.stdin, process.stdout)
  , deployerAddress = coreAddresses.getAddressForUser(deployerName)
  , UtilityRegistrarContractInteract = require(rootPrefix + '/lib/contract_interact/utility_registrar')
  , utilityRegistrarAddress = coreAddresses.getAddressForUser('utilityRegistrar')
  , foundationAddress = coreAddresses.getAddressForUser("foundation")
  , OpenSTUtilityContractInteractKlass = require(rootPrefix + '/lib/contract_interact/openst_utility')
  , StPrimeContractInteract = require(rootPrefix + '/lib/contract_interact/st_prime')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , populateEnvVars = require(rootPrefix + "/lib/populate_env_vars.js");

const deploymentOptions = {
  gasPrice: coreConstants.OST_UTILITY_GAS_PRICE_FOR_DEPLOYMENT,
  gas: coreConstants.OST_UTILITY_GAS_LIMIT
};

const performer = async function (argv) {

  const is_travis_ci_enabled = (argv[2] === 'travis');
  const stPrimeTotalSupplyInWei = web3Provider.utils.toWei(coreConstants.OST_UTILITY_STPRIME_TOTAL_SUPPLY, "ether");
  logger.info("Deployer Address: " + deployerAddress);
  logger.info("Total ST Prime Which will be transferred: " + stPrimeTotalSupplyInWei);
  logger.info("Foundation Address: " + foundationAddress);
  logger.info("Utility Chain Registrar User Address: " + utilityRegistrarAddress);
  logger.info("Travis CI enabled Status: " + is_travis_ci_enabled);

  if (is_travis_ci_enabled === false ) {
    await new Promise(
      function (onResolve, onReject) {
        prompts.question("Please verify all above details. Do you want to proceed? [Y/N]", function (intent) {
          if (intent === 'Y') {
            logger.info('Great! Proceeding deployment.');
            prompts.close();
            onResolve();
          } else {
            logger.info('Exiting deployment scripts. Change the env vars and re-run.');
            process.exit(1);
          }
        });
      }
    );
  } else {
    prompts.close();
  }

  // deploy Registrar
  var contractName = 'utilityRegistrar'
    , contractAbi = coreAddresses.getAbiForContract(contractName)
    , contractBin = coreAddresses.getBinForContract(contractName);

  logger.step("Deploying " + contractName + "Contract on UtilityChain");
  var registrarContractDeployResult = await deployHelper.perform(
    contractName,
    web3Provider,
    contractAbi,
    contractBin,
    deployerName,
    deploymentOptions
  );
  logger.log(registrarContractDeployResult);

  // set ops address to UC registrar addr
  var registrarContractAddress = registrarContractDeployResult.contractAddress
    , utilityRegistrarContractInteract = new UtilityRegistrarContractInteract(registrarContractAddress);

  logger.win(contractName + " Contract deployed at " + registrarContractAddress);

  logger.log('\nSetting Ops Address to Utility Chain Registrar Contract Address');

  var setOpsAddressresponse = await utilityRegistrarContractInteract.setOpsAddress(deployerName,
    utilityRegistrarAddress, deploymentOptions);

  logger.log(setOpsAddressresponse.data.formattedTransactionReceipt);

  var getOpsAddressresponse = await utilityRegistrarContractInteract.getOpsAddress();

  logger.log('Verifying if Ops Address Was Set to registrar contract address: ' + registrarContractAddress);

  if (web3Provider.utils.toChecksumAddress(getOpsAddressresponse.data.address) !=
    web3Provider.utils.toChecksumAddress(utilityRegistrarAddress)) {
    logger.error("Exiting the deployment as setops address doesn't match with contract ops address");
    process.exit(0);
  }

  logger.win('Ops Address Set to registrar contract address: ' + registrarContractAddress);

  // initiate owner ship transfer to foundationAddress
  logger.log('\nInitiating Ownership Transfer of contract: ' + contractName + " from deployer: " + deployerName + " to foundation: "+ foundationAddress);

  var initiateOwnershipTransferResponse = await utilityRegistrarContractInteract.initiateOwnerShipTransfer(deployerName,
      foundationAddress, deploymentOptions);

  logger.log('\nVerifying Ownership Transfer of contract: ' + contractName + " to deployer: " + deployerName);

  var proposedOwnerResult = await utilityRegistrarContractInteract.getOwner();

  if (web3Provider.utils.toChecksumAddress(proposedOwnerResult.data.owner) != web3Provider.utils.toChecksumAddress(foundationAddress)) {
    logger.error("Exiting the deployment as initialite ownership address doesn't match with contract owner address");
    process.exit(0);
  }

  logger.win('Completed Ownership transfer of contract: ' + contractName + ' to deployer: ' + deployerName);

  //deploy contract openSTUtility, auto deploys ST" contract
  var contractName = 'openSTUtility'
    , contractAbi = coreAddresses.getAbiForContract(contractName)
    , contractBin = coreAddresses.getBinForContract(contractName);

  logger.log('\nDeploying Contract ' + contractName + ' on UtilityChain');
  var utiltiyContractDeployResponse = await deployHelper.perform(
    contractName,
    web3Provider,
    contractAbi,
    contractBin,
    deployerName,
    deploymentOptions,
    [coreConstants.OST_VALUE_CHAIN_ID, coreConstants.OST_UTILITY_CHAIN_ID, registrarContractAddress]
  );

  logger.log(utiltiyContractDeployResponse);

  var openSTUtilityContractAddress = utiltiyContractDeployResponse.contractAddress
    , openStUtilityContractInteract = new OpenSTUtilityContractInteractKlass(openSTUtilityContractAddress);

  logger.win(contractName + " Contract deployed at " + openSTUtilityContractAddress);

  // initiate owner ship transfer to foundationAddress
  logger.log('\nInitiating Ownership Transfer of contract: ' + contractName + " from deployer: " + deployerName + " to foundationAddress: " + foundationAddress);

  var initiateOwnershipTransferResponse = await openStUtilityContractInteract.initiateOwnerShipTransfer(deployerName,
      foundationAddress, deploymentOptions);

  logger.log('\nVerifying Ownership Transfer of contract: ' + contractName + " to deployer: " + deployerName);

  var proposedOwnerResult = await openStUtilityContractInteract.getOwner();

  if (web3Provider.utils.toChecksumAddress(proposedOwnerResult.data.owner) != web3Provider.utils.toChecksumAddress(foundationAddress)) {
    logger.error("Exiting the deployment as initialite ownership for contract: " + contractName + " address doesn't match");
    process.exit(0);
  }

  logger.win('Completed Ownership transfer of contract: ' + contractName + ' to deployer: ' + deployerName);

  // Query to get ST" UUID
  logger.info("Querying to get ST Prime UUID");
  var stPrimeUUIDResponse = await openStUtilityContractInteract.getSimpleTokenPrimeUUID();
  var simpleTokenPrimeUUID = stPrimeUUIDResponse.data.simpleTokenPrimeUUID;
  logger.win("ST Prime UUID: " + simpleTokenPrimeUUID);

  if (simpleTokenPrimeUUID.length <= 2) {
    logger.error("Exiting the deployment as simpleTokenPrimeUUID has invalid length");
    process.exit(0);
  }

  // Query to get ST" Contract Address
  logger.info("Querying to get ST Prime Auto deployed contract address");
  var stPrimeContractResponse = await openStUtilityContractInteract.getSimpleTokenPrimeContractAddress();
  var simpleTokenPrimeContractAddress = stPrimeContractResponse.data.simpleTokenPrimeContractAddress;
  logger.win("ST Prime Contract Address: " + simpleTokenPrimeContractAddress);

  const code = await web3Provider.eth.getCode(simpleTokenPrimeContractAddress);
  if (code.length <= 2) {
    logger.error("Contract deployment failed. Invalid code length for contract: " + contractName);
    process.exit(0);
  }

  // Transfer all base tokens from deploy key to ST" contract address
  var deployerBalanceInWei = await web3Provider.eth.getBalance(coreAddresses.getAddressForUser(deployerName));
  logger.info("Deployer Balance in Wei: " + deployerBalanceInWei);

  if (deployerBalanceInWei != stPrimeTotalSupplyInWei) {
    logger.error("deployer: " + deployerName + " doesn't have max total supply");
    process.exit(0);
  }

  logger.info("Transfering all ST Prime Base Tokens to STPrime Contract Address: " + simpleTokenPrimeContractAddress);
  var stPrimeUtilityContractInteract = new StPrimeContractInteract(simpleTokenPrimeContractAddress);
  var stPrimeTransferResponse = await stPrimeUtilityContractInteract.initialize_transfer(deployerName, deploymentOptions);
  logger.win("Transferred all ST Prime Base Tokens to STPrime Contract Address: " + simpleTokenPrimeContractAddress);

  logger.info("Checking balance of simpleTokenPrimeContractAddress: " + simpleTokenPrimeContractAddress);
  var simpleTokenPrimeContractBalanceInWei = await web3Provider.eth.getBalance(simpleTokenPrimeContractAddress);
  logger.info(simpleTokenPrimeContractBalanceInWei);

  if (simpleTokenPrimeContractBalanceInWei != stPrimeTotalSupplyInWei) {
    logger.error("simpleTokenPrimeContract: " + simpleTokenPrimeContractAddress + " doesn't have max total supply");
    process.exit(0);
  }

  var deployerBalanceInWeiAfterTransfer = await web3Provider.eth.getBalance(coreAddresses.getAddressForUser(deployerName));
  logger.info("Deployer Balance in Wei After Transfer: " + deployerBalanceInWeiAfterTransfer);
  if (deployerBalanceInWeiAfterTransfer != 0) {
    logger.error("deployer balance should be 0 after transfer");
    process.exit(0);
  }

  logger.info("Updating ENV vars source file");
  populateEnvVars.renderAndPopulate('deployScript2AddressesTemplate', {
    ost_utility_registrar_contract_addr: registrarContractAddress,
    ost_openstutility_contract_addr: openSTUtilityContractAddress,
    ost_openstutility_st_prime_uuid: simpleTokenPrimeUUID,
    ost_stprime_contract_addr: simpleTokenPrimeContractAddress
  });
  logger.win("ENV vars Source file Updated");
  logger.win("Successfully Completed!!!");


};

// process.argv[2] == travis means proceed deployment without prompt else show prompt
performer(process.argv);