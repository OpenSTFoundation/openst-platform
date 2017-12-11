"use strict";

/**
 * This is script for deploying registrar and open st value contract on value chain.<br><br>
 *
 *   Prerequisite:
 *    <ol>
 *       <li>Simple Token Contract Address</li>
 *       <li>Foundation Address</li>
 *       <li>Deployer address on value chain</li>
 *       <li>Registrar Address</li>
 *       <li>Ops Address</li>
 *     </ol>
 *
 *   These are the following steps:<br>
 *     <ol>
 *       <li>Deploy Registrar Contract on Value Chain</li>
 *       <li>Call setOpsAddress on registrar contract with the Ops Address</li>
 *       <li>Deploy OpenST Value Contract on Value Chain</li>
 *       <li>Transfer the ownership for openST value contract to foundation</li>
 *     </ol>
 *
 *
 * @module tools/deploy/openst_value
 */

const rootPrefix = '../..'
  , readline = require('readline')
  , deployerName = "valueDeployer"
  , web3Provider = require(rootPrefix + '/lib/web3/providers/value_rpc')
  , deployHelper = require('./helper')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , prompts = readline.createInterface(process.stdin, process.stdout)
  , deployerAddress = coreAddresses.getAddressForUser(deployerName)
  , Assert = require('assert')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , ValueRegistrar = require(rootPrefix + "/lib/contract_interact/value_registrar")
  , OpenstValueContract = require(rootPrefix + '/lib/contract_interact/openst_value')
  , populateEnvVars = require(rootPrefix + "/lib/populate_env_vars.js")
  , foundationAddress = coreAddresses.getAddressForUser("foundation")
  , valueOpsAddress = coreAddresses.getAddressForUser("valueOps")
  , simpleTokenAddress = coreAddresses.getAddressForContract("simpleToken");

const deploymentOptions = {
  gasPrice: coreConstants.OST_VALUE_GAS_PRICE,
  gas: coreConstants.OST_VALUE_GAS_LIMIT
};

/**
 * Updates dynamic addresses generated in the deployment process to a persistant source file
 * It would be used later on.
 *
 * @param {String} valueRegistrarContractAddress
 * @param {String} valueSTContractAddress
 *
 * @return {}
 */

function updateConfig(valueRegistrarAddr, valueSTContractAddr) {

  return new Promise(
    function (onResolve, onReject) {
      logger.step("Updating Source file open_st_env_vars");
      populateEnvVars.renderAndPopulate('valueRegistrar', {
        ost_value_registrar_contract_address: valueRegistrarAddr
      });

      populateEnvVars.renderAndPopulate('valueOpenst', {
        ost_openst_value_contract_address: valueSTContractAddr
      });

      onResolve();
    })
    .then(function () {
      logger.win("open_st_env_vars updated.");
    })
    .catch(function (reason) {
      logger.error("Failed to populate open_st_env_vars.sh file!");
      logger.error(reason);
      process.exit(1);
    });

};

/**
 * It is the main performer method of this deployment script
 *
 * @param {}
 *
 * @return {}
 */

const performer = async function () {

  logger.step("Deploying Registrar on Value Chain");
  logger.info("Deployer Address: " + deployerAddress);
  logger.info("Foundation Address: " + foundationAddress);
  logger.info("Value Ops Address: " + valueOpsAddress);
  logger.info("Simple Token Contract Address: " + simpleTokenAddress);

  await new Promise(
    function (onResolve, onReject) {
      prompts.question("Please verify all above details. Do you want to proceed? [Y/N]", function (intent) {
        if (intent === 'Y') {
          logger.info('Great! Proceeding deployment.');
          prompts.close();
          onResolve();
        } else {
          logger.error('Exiting deployment scripts. Change the env vars and re-run.');
          process.exit(1);
        }
      });
    }
  );

  var contractName = 'valueRegistrar'
    , contractAbi = coreAddresses.getAbiForContract(contractName)
    , contractBin = coreAddresses.getBinForContract(contractName);

  logger.step("Deploying Registrar Contract on ValueChain");

  var contractDeployTxReceipt = await deployHelper.perform(
    contractName,
    web3Provider,
    contractAbi,
    contractBin,
    deployerName,
    deploymentOptions
  );
  logger.info(contractDeployTxReceipt);
  logger.win(contractName + " Contract deployed ");

  var registrarContractAddr = contractDeployTxReceipt.contractAddress;

  logger.step("Set ops address to value ops user address: " + valueOpsAddress);

  const valueRegistrar = new ValueRegistrar(registrarContractAddr);

  var resultHelper = await valueRegistrar.setOpsAddress(deployerName, valueOpsAddress);

  logger.step("Verifying if ops address is set properly of not: " + valueOpsAddress);

  var opsAddress = await valueRegistrar.getOpsAddress();

  if (web3Provider.utils.toChecksumAddress(opsAddress.data.address) != web3Provider.utils.toChecksumAddress(valueOpsAddress)) {
    logger.error("Exiting the deployment as setops address doesn't match");
    process.exit(0);
  }

  logger.win(" Ops address set to deployer address ");

  logger.step("Deploying OpenST Value Contract on ValueChain");

  var contractName = 'openSTValue'
    , contractAbi = coreAddresses.getAbiForContract(contractName)
    , contractBin = coreAddresses.getBinForContract(contractName);

  var constructorArgs = [
    coreConstants.OST_VALUE_CHAIN_ID,
    simpleTokenAddress,
    registrarContractAddr
  ]

  var contractDeployTxReceipt = await deployHelper.perform(
    contractName,
    web3Provider,
    contractAbi,
    contractBin,
    deployerName,
    deploymentOptions,
    constructorArgs
  );

  logger.info(contractDeployTxReceipt);
  logger.win(contractName + " Contract deployed ");

  var openstValueContractAddress = contractDeployTxReceipt.contractAddress;

  logger.step("Transfering Ownership to STF");

  var openstValueContract = new OpenstValueContract(openstValueContractAddress);

  var contractDeployResponse = await openstValueContract.initiateOwnerShipTransfer(
    deployerName,
    foundationAddress
  );

  logger.step("Verifying Ownership transfer success");

  var proposedOwnerResult = await openstValueContract.getOwner();

  if (web3Provider.utils.toChecksumAddress(proposedOwnerResult.data.owner) != web3Provider.utils.toChecksumAddress(foundationAddress)) {
    logger.error("Exiting the deployment as initialite ownership address doesn't match");
    process.exit(0);
  }

  logger.win(" Ownership transfered ");

  await updateConfig(registrarContractAddr, openstValueContractAddress);

  logger.win(" Deploy script 1 completed ");
};

performer();