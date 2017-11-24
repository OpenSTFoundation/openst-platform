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
  , logger = require(rootPrefix + "/helpers/CustomConsoleLogger")
  , ValueRegistrar = require(rootPrefix+"/lib/contract_interact/value_registrar")
  , OpenstValueContract = require(rootPrefix+'/lib/contract_interact/openst_value')
;


const performer = async function() {

  logger.info("Deploying Registrar on Value Chain");
  logger.info("Deployer Address: " + deployerAddress);

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

  var contractName = 'registrar'
    ,contractAbi = coreAddresses.getAbiForContract(contractName)
    ,contractBin = coreAddresses.getBinForContract(contractName);

  logger.info("Deploying Registrar Contract on ValueChain");

  var contractDeployTxReceipt = await deployHelper.perform(
    contractName,
    web3Provider,
    contractAbi,
    contractBin,
    deployerName
  );
  logger.info(contractDeployTxReceipt);
  logger.win(contractName + " Contract deployed ");

  var registrarContractAddr = contractDeployTxReceipt.contractAddress;

  logger.info("Set ops address to deployer address: " + deployerAddress);

  const valueRegistrar = new ValueRegistrar(registrarContractAddr);

  var resultHelper = await valueRegistrar.setOpsAddress(deployerName, deployerAddress);

  logger.win(" Ops address set to deployer address ");

  logger.info("Deploying OpenST Value Contract on ValueChain");

  var contractName = 'openSTValue'
    ,contractAbi = coreAddresses.getAbiForContract(contractName)
    ,contractBin = coreAddresses.getBinForContract(contractName);

  var constructorArgs = [
    coreConstants.OST_VALUE_CHAIN_ID,
    coreAddresses.getAddressesForContract("simpleToken"),
    registrarContractAddr
  ]

  var contractDeployTxReceipt = await deployHelper.perform(
    contractName,
    web3Provider,
    contractAbi,
    contractBin,
    deployerName,
    constructorArgs
  );

  logger.info(contractDeployTxReceipt);
  logger.win(contractName + " Contract deployed ");

  var openstValueContractAddress = contractDeployTxReceipt.contractAddress;

  logger.info("Transfering Ownership to STF");

  var openstValueContract = new OpenstValueContract(openstValueContractAddress);

  var contractDeployTxReceipt = await openstValueContract.initiateOwnerShipTransfer(
    deployerName,
    coreAddresses.getAddressForContract("foundation")
  );

  logger.win(" Ownership transfered ");

};

performer();