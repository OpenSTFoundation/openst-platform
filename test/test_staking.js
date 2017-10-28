const Assert = require('assert');

const Config = require('../config.json');
const Geth = require('../lib/geth');
const StakeContract = require('../lib/stakeContract');
const BT = require('../lib/bt');

const SimpleTokenJson = require("../contracts/SimpleToken.json");

function AssertEvent(receipt, event, message) {
    //console.log(receipt);
    Assert.ok(event in receipt.events, message || `Missing event ${event}`);
    return receipt.value;
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

    const Member = Config.Members[0];
    const MC = Member.Reserve;
    const StakeSizeST = 100000;

    console.log("Check funds");
    Assert.ok(await Geth.ValueChain.eth.getBalance(Config.SimpleTokenFoundation) > 10000, "Please fund STF @ "+Config.SimpleTokenFoundation);
    Assert.ok(await Geth.ValueChain.eth.getBalance(MC) > 10000, "Please fund MC @ "+MC);

    // Give grant
    console.log("Unlock foundation account");
    await Geth.ValueChain.eth.personal.unlockAccount(Config.SimpleTokenFoundation);

    const finalized = await ST.methods.finalized().call();
    if (!finalized) {
        console.log("Finalize token contract");
        await ST.methods.finalize().send({from: Config.SimpleTokenFoundation});
    }

    console.log("Transfer grant to MC");
    Assert.ok(await ST.methods.transfer(MC, StakeSizeST).send({from: Config.SimpleTokenFoundation}), "Transfer failed");
    AssertEvent(await ST.methods.transfer(MC, StakeSizeST).send({from: Config.SimpleTokenFoundation}), "Transfer");
    //Assert.strictEqual(, true);

    console.log("Unlock MC account");
    await Geth.ValueChain.eth.personal.unlockAccount(MC);

    const CurrentAllowance = await ST.methods.allowance(MC, Config.ValueChain.Stake).call({from: MC});
    if (CurrentAllowance != StakeSizeST) {
        console.log("Reset stake allowance");
        Assert.ok(await ST.methods.approve(Config.ValueChain.Stake, 0).call({from: MC}), "approve failed");
        AssertEvent(await ST.methods.approve(Config.ValueChain.Stake, 0).send({from: MC}), "Approval");

        console.log("Init stake allowance");
        Assert.ok(await ST.methods.approve(Config.ValueChain.Stake, StakeSizeST).call({from: MC}), "approve failed");
        AssertEvent(await ST.methods.approve(Config.ValueChain.Stake, StakeSizeST).send({from: MC}), "Approval");
    }

    Assert.equal(await ST.methods.allowance(MC, Config.ValueChain.Stake).call({from: MC}), StakeSizeST);

    console.log("Increase the stake");
    Assert.notEqual(await Geth.ValueChain.eth.getCode(Config.ValueChain.Stake), "0x");
    const stakeContract = new StakeContract(Config.SimpleTokenFoundation, Config.ValueChain.Stake);
    Assert.equal(await stakeContract._instance.methods.eip20Token().call(), Config.ValueChain.SimpleToken);

    console.log("Set the admin address (TODO: move to deploy)");
    Assert.equal(await stakeContract._instance.methods.owner().call(), stakeContract._foundation)
    AssertEvent(await stakeContract._instance.methods.setAdminAddress(stakeContract._admin).send({from: stakeContract._foundation}), "AdminAddressChanged");
    Assert.equal(await stakeContract._instance.methods.adminAddress().call(), stakeContract._admin)

    // const SimpleTokenStakeJson = require("./contracts/SimpleTokenStake.json").contracts["SimpleTokenStake.sol:SimpleTokenStake"];
    // const stakeInstance = new Geth.ValueChain.eth.Contract(JSON.parse(SimpleTokenStakeJson.abi), Config.ValueChain.Stake);
    // const success = await stakeInstance.methods.increaseStake(StakeSizeST).call({from: MC});
    // console.log(success);
    Assert.ok(await ST.methods.transferFrom(MC, Config.ValueChain.Stake, 1).call({from: Config.ValueChain.Stake}), "transferFrom failed");

    console.log("Register the UT on the value chain");
    const chainId = Member.ChainId;

    // registerUtilityToken will throw if Member has been previously registered
    Member.UUID = AssertEvent(await stakeContract.registerUtilityToken(Member.Symbol, Member.Name, Member.Decimals, Member.ConversionRate, chainId, MC), "UtilityTokenRegistered");
    console.log("UUID =", Member.UUID);

    const ut = await stakeContract._instance.methods.utilityTokens(Member.UUID).call();
    Assert.equal(ut.chainId, chainId);
    Assert.equal(ut.stakingAccount, MC);

    console.log("Stake", StakeSizeST, "ST");
    const stakeTX = await stakeContract.stake(MC, Member.UUID, StakeSizeST);
    const stakeUT = AssertEvent(stakeTX, "MintingIntentDeclared");

    const mintingUuid = stakeTX.events.MintingIntentDeclared.returnValues._uuid;
    const mintingStaker = stakeTX.events.MintingIntentDeclared.returnValues._staker;
    const mintingStakerNonce = stakeTX.events.MintingIntentDeclared.returnValues._stakerNonce;
    const mintingAmountST = stakeTX.events.MintingIntentDeclared.returnValues._amountST;
    const mintingAmountUT = stakeTX.events.MintingIntentDeclared.returnValues._amountUT;
    const mintingEscrowUnlockHeight = stakeTX.events.MintingIntentDeclared.returnValues._escrowUnlockHeight;
    const mintingIntentHash = stakeTX.events.MintingIntentDeclared.returnValues._mintingIntentHash;

    const bt = new BT(MC, Member.ERC20);

    AssertEvent(await bt.mint(mintingUuid, mintingStaker, mintingStakerNonce, mintingAmountST, mintingAmountUT, mintingEscrowUnlockHeight, mintingIntentHash), "MintingIntentConfirmed");

    console.log("Success.");

})().catch(err => {
    console.log(err.stack);
    process.exit(1);
});
