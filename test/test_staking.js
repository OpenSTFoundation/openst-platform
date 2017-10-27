const Assert = require('assert');

const Config = require('../config.json');
const Geth = require('../lib/geth');
const StakeContract = require('../lib/stakeContract');

const SimpleTokenJson = require("../contracts/SimpleToken.json");

function AssertEvent(receipt, event, message) {
    //console.log(receipt);
    Assert.ok(event in receipt.events, message || `Missing event ${event}`);
}

(async _ => {

    const abi = JSON.parse(SimpleTokenJson.contracts["SimpleToken.sol:SimpleToken"].abi);
    Assert.notEqual(await Geth.ValueChain.eth.getCode(Config.ValueChain.SimpleToken), "0x");
    const ST = new Geth.ValueChain.eth.Contract(abi, Config.ValueChain.SimpleToken);

    // Sanity check
    Assert.strictEqual(await ST.methods.symbol().call(), "ST");
    Assert.strictEqual(await ST.methods.name().call(), "Simple Token");
    Assert.strictEqual(await ST.methods.owner().call(), Config.SimpleTokenFoundation);
    Assert.ok(await ST.methods.balanceOf(Config.SimpleTokenFoundation).call() > 0, "Foundation has no tokens");

    const MC = Config.Members[0].Reserve;//"0x85FD30FE5e2d832a938b35939a67696b6f7F634C";
    const StakeSize = 100000;

    console.log("Check funds");
    Assert.ok(await Geth.ValueChain.eth.getBalance(Config.SimpleTokenFoundation) > 10000, "Please fund STF @ "+Config.SimpleTokenFoundation);
    Assert.ok(await Geth.ValueChain.eth.getBalance(MC) > 10000, "Please fund MC @ "+MC);

    // Give grant
    console.log("Unlock foundation account");
    await Geth.ValueChain.eth.personal.unlockAccount(Config.SimpleTokenFoundation);
    console.log("Finalize token contract");
    //await ST.methods.finalize().send({from: Config.SimpleTokenFoundation});
    console.log("Transfer grant to MC");
    Assert.ok(await ST.methods.transfer(MC, StakeSize).send({from: Config.SimpleTokenFoundation}), "Transfer failed");
    AssertEvent(await ST.methods.transfer(MC, StakeSize).send({from: Config.SimpleTokenFoundation}), "Transfer");
    //Assert.strictEqual(, true);

    console.log("Unlock MC account");
    const CurrentAllowance = await ST.methods.allowance(MC, Config.ValueChain.Stake).call({from: MC});
    await Geth.ValueChain.eth.personal.unlockAccount(MC);
    if (CurrentAllowance != StakeSize) {
        console.log("Reset stake allowance");
        Assert.ok(await ST.methods.approve(Config.ValueChain.Stake, 0).call({from: MC}), "approve failed");
        AssertEvent(await ST.methods.approve(Config.ValueChain.Stake, 0).send({from: MC}), "Approval");

        console.log("Init stake allowance");
        Assert.ok(await ST.methods.approve(Config.ValueChain.Stake, StakeSize).call({from: MC}), "approve failed");
        AssertEvent(await ST.methods.approve(Config.ValueChain.Stake, StakeSize).send({from: MC}), "Approval");
    }

    Assert.equal(await ST.methods.allowance(MC, Config.ValueChain.Stake).call({from: MC}), StakeSize);

    console.log("Increase the stake");
    Assert.notEqual(await Geth.ValueChain.eth.getCode(Config.ValueChain.Stake), "0x");
    const stakeContract = new StakeContract(MC, Config.ValueChain.Stake);
    Assert.equal(await stakeContract._instance.methods.eip20Token().call(), Config.ValueChain.SimpleToken);
    // const SimpleTokenStakeJson = require("./contracts/SimpleTokenStake.json").contracts["SimpleTokenStake.sol:SimpleTokenStake"];
    // const stakeInstance = new Geth.ValueChain.eth.Contract(JSON.parse(SimpleTokenStakeJson.abi), Config.ValueChain.Stake);
    // const success = await stakeInstance.methods.increaseStake(StakeSize).call({from: MC});
    // console.log(success);
    Assert.ok(await ST.methods.transferFrom(MC, Config.ValueChain.Stake, 1).call({from: Config.ValueChain.Stake}), "transferFrom failed");
    AssertEvent(await stakeContract.increaseStake(StakeSize), "StakeChanged");

    console.log("Success.");

})().catch(err => {
    console.log(err.stack);
    process.exit(1);
});
