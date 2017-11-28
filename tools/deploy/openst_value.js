"use strict";

const rootPrefix = '../..'
  , readline = require('readline')
  , config = require(rootPrefix + '/config.json')
  , deployerName = "deployer"
  , web3Provider = require(rootPrefix+'/lib/web3/providers/value_rpc')
  , deployHelper = require('./helper')
  , coreConstants = require(rootPrefix+'/config/core_constants')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , prompts = readline.createInterface(process.stdin, process.stdout)
  , deployerAddress = coreAddresses.getAddressForUser(deployerName)
  , Assert = require('assert')
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  , ValueRegistrar = require(rootPrefix+"/lib/contract_interact/value_registrar")
  , OpenstValueContract = require(rootPrefix+'/lib/contract_interact/openst_value')
  , populateEnvVars = require(rootPrefix+"/lib/populate_env_vars.js")
  , foundationAddress = coreAddresses.getAddressForUser("foundation")
  , simpleTokenAddress = coreAddresses.getAddressForContract("simpleToken")
  , deploymentOptions = { gasPrice: coreConstants.OST_VALUE_GAS_PRICE}
;

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
  .then( function () {
    logger.win("open_st_env_vars updated.");
  })
  .catch( function(reason)  {
    logger.error("Failed to populate open_st_env_vars.sh file!");
    logger.error(reason);
    process.exit(1);
  });

};

const performer = async function() {

  logger.step("Deploying Registrar on Value Chain");
  logger.info("Deployer Address: " + deployerAddress);
  logger.info("Foundation Address: " + foundationAddress);
  logger.info("Simple Token Contract Address: " + simpleTokenAddress);

  await new Promise(
    function (onResolve, onReject){
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
    ,contractAbi = coreAddresses.getAbiForContract(contractName)
    ,contractBin = coreAddresses.getBinForContract(contractName);

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

  logger.step("Set ops address to deployer address: " + deployerAddress);

  const valueRegistrar = new ValueRegistrar(registrarContractAddr);

  var resultHelper = await valueRegistrar.setOpsAddress(deployerName, deployerAddress);

  logger.win(" Ops address set to deployer address ");

  logger.step("Deploying OpenST Value Contract on ValueChain");

  var contractName = 'openSTValue'
    ,contractAbi = coreAddresses.getAbiForContract(contractName)
    ,contractBin = coreAddresses.getBinForContract(contractName);

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

  logger.win(" Ownership transfered ");

  await updateConfig(registrarContractAddr, openstValueContractAddress);

  logger.win(" Deploy script 1 completed ");
};

performer();