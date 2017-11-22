"use strict";

const rootPrefix = '../..'
  , readline = require('readline')
  , contractName = 'staking'
  , deployerName = 'foundation'
  , web3Provider = require(rootPrefix+'/lib/web3/providers/value_rpc')
  , deployHelper = require('./helper')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , prompts = readline.createInterface(process.stdin, process.stdout)
  , deployerAddress = coreAddresses.getAddressForUser(deployerName)
  , deployerPassphrase = coreAddresses.getPassphraseForUser(deployerName)
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , contractBin = coreAddresses.getBinForContract(contractName)
  , registrarAddress = coreAddresses.getAddressForUser('registrar');

const performer = async function() {
  console.log(contractName + " - Deployer Address: " + deployerAddress);
  console.log(contractName + " - Registrar Address: " + registrarAddress);

  await new Promise(
    function (onResolve, onReject){
      prompts.question("Please verify all above addresses. Do you want to proceed? [Y/N]", function (intent) {
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

  await deployHelper.perform(
    contractName,
    web3Provider,
    contractAbi,
    contractBin,
    deployerAddress,
    deployerPassphrase
  );

  const stakingContractAddr = deploySummary.contractAddress
    , currContract = new web3RpcProvider.eth.Contract(coreAbis.staking, stakingContractAddr);

  await currContract.methods.setAdminAddress(registrarAddress).send(
    from: deployerAddress,
    gasPrice: coreConstants.OST_DEFAULT_GAS_PRICE
  );

};

performer();