"use strict";

const rootPrefix = '../..'
  , readline = require('readline')
  , config = require(rootPrefix + '/config.json')
  , deployerName = 'deployer'
  , web3Provider = require(rootPrefix+'/lib/web3/providers/utility_rpc')
  , deployHelper = require('./helper')
  , coreConstants = require(rootPrefix+'/config/core_constants')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , prompts = readline.createInterface(process.stdin, process.stdout)
  , deployerAddress = coreAddresses.getAddressForUser(deployerName)
  , UtilityRegistrarContractInteract = require(rootPrefix+'/contract_interact/utility_registrar')
  , utilityChainOwnerAddress = coreAddresses.getAddressForUser('utilityChainOwner')
  , OpenStUtilityContractInteract = require(rootPrefix+'/contract_interact/openst_utility')
  , StPrimeContractInteract = require(rootPrefix+'/contract_interact/st_prime')
  ;

// TODO Colourful Logger Changes
// TODO var VS const
const performer = async function() {

  console.log("Deployer Address: " + deployerAddress);
  console.log("Total ST Prime: " + coreConstants.OST_UTILITY_STPRIME_TOTAL_SUPPLY);
  console.log("Utility Chain Registrar Address: " + coreAddresses.getAddressForUser('registrar'));

  await new Promise(
    function (onResolve, onReject){
      prompts.question("Please verify all above details. Do you want to proceed? [Y/N]", function (intent) {
        if (intent === 'Y') {
          console.log('Great! Proceeding deployment.');
          prompts.close();
          onResolve();
        } else {
          console.log('Exiting deployment scripts. Change the env vars and re-run.');
          process.exit(1);
        }
      });
    }
  );

  // deploy Registrar
  var contractName = 'registrar'
     ,contractAbi = coreAddresses.getAbiForContract(contractName)
     ,contractBin = coreAddresses.getBinForContract(contractName);

  console.log("Deploying Registrar Contract on UtilityChain");
  var contractDeployTxReceipt = await deployHelper.perform(
    contractName,
    web3Provider,
    contractAbi,
    contractBin,
    deployerName
  );
  console.log(contractDeployTxReceipt);
  console.log(contractName + " Contract deployed ");

  // set ops address to VC registrar addr
  const registrarContractAddress = contractDeployTxReceipt.contractAddress
    ,utilityRegistrarContractInteract = new UtilityRegistrarContractInteract(registrarContractAddress);
  // set ops address to VC registrar addr
  var response = await utilityRegistrarContractInteract.setOpsAddress(deployerName, registrarContractAddress);
  // initiate owner ship transfer to utilityChainOwnerAddress
  var response = await utilityRegistrarContractInteract.initiateOwnerShipTransfer(deployerName, utilityChainOwnerAddress);


  //deploy contract openSTUtility, auto deploys ST" contract
  var contractName = 'openSTUtility'
  ,contractAbi = coreAddresses.getAbiForContract(contractName)
  ,contractBin = coreAddresses.getBinForContract(contractName);

  console.log("Deploying Registrar Contract on UtilityChain");
  var contractDeployTxReceipt = await deployHelper.perform(
    contractName,
    web3Provider,
    contractAbi,
    contractBin,
    deployerName
  );
  console.log(contractDeployTxReceipt);
  console.log(contractName + " Contract deployed ");

  const openSTUtilityContractAddress = contractDeployTxReceipt.contractAddress
    ,openStUtilityContractInteract = new OpenStUtilityContractInteract(openSTUtilityContractAddress);

  // initiate owner ship transfer to utilityChainOwnerAddress
  var response = await openStUtilityContractInteract.initiateOwnerShipTransfer(deployerName, utilityChainOwnerAddress);

  // Query to get ST" Contract Address
  var response = await openStUtilityContractInteract.getSimpleTokenPrimeContractAddress();
  var simpleTokenPrimeContractAddress = response.data.simpleTokenPrimeContractAddress;

  // Transfer all base tokens from deploy key to ST" contract address
  var openStUtilityContractInteract = new StPrimeContractInteract(simpleTokenPrimeContractAddress);
  var response = await openStUtilityContractInteract.initialize(coreConstants.OST_UTILITY_STPRIME_TOTAL_SUPPLY);

};

performer();