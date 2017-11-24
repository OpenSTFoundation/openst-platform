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
  ;

// TODO Colourful Logger Changes
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

  //set ops address to VC registrar addr
  const contractAddress = contractDeployTxReceipt.contractAddress;





};

performer();