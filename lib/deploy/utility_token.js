"use strict";

const rootPrefix = '../..'
  , readline = require('readline')
  , contractName = 'utilityToken'
  , config = require(rootPrefix + '/config.json')
  , deployerName = 'registrar'
  , web3Provider = require(rootPrefix+'/lib/web3/providers/utility_rpc')
  , deployHelper = require('./helper')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , prompts = readline.createInterface(process.stdin, process.stdout)
  , deployerAddress = coreAddresses.getAddressForUser(deployerName)
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , contractBin = coreAddresses.getBinForContract(contractName)
  , Assert = require('assert')
  , stakingContractInteract = require('../contract_interact/staking')
  , UpdateMemberInfo = require(rootPrefix+"/lib/updateMemberInfo")
  , UtilityTokenContractInteract = require('../contract_interact/utilityToken');

const describeMemberDetails = function(member){
  console.log("Describing Member Details...");
  for (var mem in member){
    console.log(mem + ": " + member[mem]);
  }
};

const validateMemberDetails = function(member) {
  Assert.strictEqual(typeof member.Symbol, 'string', "symbol must be of type 'string'");
  Assert.strictEqual(typeof member.Name, 'string', "name must be of type 'string'");
  Assert.strictEqual(typeof member.Decimals, 'number', "decimals must be of type 'number'");
  Assert.strictEqual(typeof member.ChainId, 'string', "chainId must be of type 'string'");
  Assert.strictEqual(typeof member.ConversionRate, 'number', "conversionRate must be of type 'number'");
  Assert.strictEqual(typeof member.Reserve, 'string', "Reserve must be of type 'string'");
  Assert.strictEqual(typeof member.ERC20, 'string', "ERC20 must be of type 'string'");

  Assert.notEqual(member.Symbol, "");
  Assert.notEqual(member.Name, "");
  Assert.notEqual(member.ChainId, "");
  Assert.notEqual(member.Reserve, "");
  Assert.ok(member.ConversionRate > 0, "Conversation rate must be > 0");
  Assert.ok(member.Decimals > 0, "decimals must be ≥ 0");
  Assert.ok(member.Decimals <= 18, "decimals must be ≤ 18");
  Assert.strictEqual(member.Decimals, Math.trunc(member.Decimals));

};

// TODO Validation old address
// TODO Print staking contract addr
const performer = async function(member) {
  describeMemberDetails(member);
  validateMemberDetails(member);

  console.log("\n" + contractName + " Deployer Name: " + deployerName);
  console.log(contractName + " Deployer Address: " + deployerAddress);

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

  console.log("Deploying Utility Token for Member: " + member.Name);
  var contractDeployTxReceipt = await deployHelper.perform(
    contractName,
    web3Provider,
    contractAbi,
    contractBin,
    deployerName,
    [member.Symbol, member.Name, member.Decimals, member.ChainId]
  );
  console.log(contractDeployTxReceipt);
  console.log("Utility Token Contract deployed for Member: " + member.Name);

  const updateMemberInfo = new UpdateMemberInfo(member);

  console.log("Updating Member Contract Address in config: " + member.Name);
  updateMemberInfo.setMemberContractAddress(contractDeployTxReceipt.contractAddress);

  console.log("\nRegistering Member company: " + member.Name +" in Staking Contract");
  var registerTxReceipt = await stakingContractInteract.registerUtilityToken(member.Symbol, member.Name, member.Decimals, member.ConversionRate, member.ChainId, member.Reserve, deployerName);
  console.log(registerTxReceipt);
  console.log("Member company: " + member.Name +" is registered in Staking Contract");

  const utilityTokenContractInteract = new UtilityTokenContractInteract(member);

  var response = await utilityTokenContractInteract.getUuid();

  console.log("Updating Member UUID in config: " + response.data.uuid);
  updateMemberInfo.setMemberUUID(response.data.uuid);

};

performer(config.Members[0]);