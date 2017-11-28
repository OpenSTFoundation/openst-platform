const Assert = require('assert');
const BigNumber = require('bignumber.js');

const Config = require('../config.json');
const Geth = require('../lib/geth');
const StakeContract = require('../lib/stakeContract');
const BT = require('../lib/bt');

const coreConstants = require('../config/core_constants')
      ,coreAddresses = require('../config/core_addresses')
      ,FOUNDATION = coreAddresses.getAddressForUser('foundation')
      ,REGISTRAR = coreAddresses.getAddressForUser('utilityRegistrar')
      ,REGISTRAR_KEY = coreAddresses.getPassphraseForUser('utilityRegistrar')
      ,SIMPLETOKEN_CONTRACT = coreAddresses.getAddressForContract('simpleToken')
      ,STAKE_CONTRACT = coreAddresses.getAddressesForContract('staking')
;

const SimpleTokenJson = require("../contracts/SimpleToken.json");

function AssertEvent(receipt, event, message) {
    //console.log(receipt);
    Assert.ok(event in receipt.events, message || `Missing event ${event} in ${receipt.transactionHash}`);
    return receipt.value;
}

const toST = function ( num ) {
  var bigNum = new BigNumber( num );
  var fact = new BigNumber( 10 ).pow( 18 );
  return bigNum.dividedBy( fact ).toString();
}


/// Minimum amount of wei an MC needs for staking (worst case) @ 20 GWei gasPrice
const MIN_MC_WEI = 100000000 * 20000000000;


Assert.equalsIgnoreCase = function () {
    var _args = Array.prototype.slice.call(arguments);
    _args.forEach( function ( arg, indx ) {
        _args[ indx ] = String( arg ).toLowerCase();
    });
    return Assert.equal.apply(Assert, _args);
}

String.prototype.equalsIgnoreCase = function ( compareWith ) {
    var _self = this.toLowerCase();
    var _compareWith = String( compareWith ).toLowerCase();
    return _self == _compareWith;
}


async function stake(Member, StakeSizeST) {

    var diplayStakeSizeST = StakeSizeST.dividedBy(new BigNumber( 10 ).pow( 18 ) );
    diplayStakeSizeST = diplayStakeSizeST.toString();

    const abi = JSON.parse(SimpleTokenJson.contracts["SimpleToken.sol:SimpleToken"].abi);
    console.log("Checking ST code", SIMPLETOKEN_CONTRACT);


    Assert.notEqual(await Geth.ValueChain.eth.getCode(SIMPLETOKEN_CONTRACT, null), "0x");


    const ST = new Geth.ValueChain.eth.Contract(abi, SIMPLETOKEN_CONTRACT);
    // Bug in web3js
    ST.setProvider(Geth.ValueChain.currentProvider);

    // Sanity check
    Assert.strictEqual(await ST.methods.symbol().call(), "ST");
    Assert.strictEqual(await ST.methods.name().call(), "Simple Token");
    Assert.equalsIgnoreCase(await ST.methods.owner().call(), FOUNDATION);
    console.log("Check ST funds of foundation", FOUNDATION);
    const stfST = await ST.methods.balanceOf(FOUNDATION).call();
    console.log(" =", toST(stfST) );
    Assert.ok(stfST > StakeSizeST, "Foundation has not enough tokens?");

    const MC = Member.Reserve;

    console.log("Check ether funds of foundation", FOUNDATION);
    const stfBalance = await Geth.ValueChain.eth.getBalance(FOUNDATION);
    console.log(" =", toST(stfBalance) );
    Assert.ok(stfBalance >= MIN_MC_WEI, "Please fund STF @ "+FOUNDATION);

    console.log("Unlock foundation account");
    await Geth.ValueChain.eth.personal.unlockAccount(FOUNDATION);

    console.log("Check ether funds of MC", MC);
    const mcBalance = await Geth.ValueChain.eth.getBalance(MC);
    console.log(" =", toST(mcBalance) );
    if (mcBalance < MIN_MC_WEI) {
        const diff = MIN_MC_WEI - mcBalance;
        console.log(" Transfer", diff, "wei from foundation to MC", MC);
        await Geth.ValueChain.eth.sendTransaction({from: FOUNDATION, to: MC, value: diff});
    }

    console.log("Check ST REGISTRAR", REGISTRAR);
    const stAdmin = await ST.methods.adminAddress().call();
    if ( !REGISTRAR.equalsIgnoreCase( stAdmin ) ) {
        console.warn("I SHOULD NOT BE DOING THIS --->");
        console.log(" Set the ST admin address", REGISTRAR);
        Assert.equalsIgnoreCase(await ST.methods.owner().call(), FOUNDATION);
        AssertEvent(await ST.methods.setAdminAddress( REGISTRAR ).send({
            from: FOUNDATION,
            gasPrice: coreConstants.OST_VALUE_GAS_PRICE
        }), "AdminAddressChanged");
        Assert.equalsIgnoreCase(await ST.methods.adminAddress().call(), REGISTRAR);
    }

    console.log("Check ST finalized flag");
    const finalized = await ST.methods.finalized().call();
    if (!finalized) {
        const adminBalance = await Geth.ValueChain.eth.getBalance( REGISTRAR );
        if (adminBalance < MIN_MC_WEI) {
            const diff = MIN_MC_WEI - adminBalance;
            console.log("Transfer", diff, "wei from foundation to ST admin", REGISTRAR);
            await Geth.ValueChain.eth.sendTransaction({from: FOUNDATION, to: REGISTRAR, value: diff});
        }
        console.warn("I SHOULD NOT BE DOING THIS ---> Finalize token contract");
        console.log(" Unlock ST admin account");
        await Geth.ValueChain.eth.personal.unlockAccount( REGISTRAR, REGISTRAR_KEY );

        console.log(" Finalize token contract");
        AssertEvent(await ST.methods.finalize().send({
            from: REGISTRAR,
            gas: 40000,
            gasPrice: coreConstants.OST_VALUE_GAS_PRICE
        }), "Finalized");
        Assert.ok(await ST.methods.finalized().call(), "Finalize failed");
    }

    console.log("Check ST funds of MC", MC);
    const mcST = await ST.methods.balanceOf(MC).call();
    console.log(" =", toST(mcST) );
    if (new BigNumber(mcST) < StakeSizeST) {
        var diff = StakeSizeST.sub(mcST);
        //TEST ->
        //diff = diff.mul( 100 );
        const displayDiff = diff.dividedBy(new BigNumber( 10 ).pow( 18 ) ).toString();
        console.log(" Transfer", displayDiff, "ST grant to MC", MC);
        Assert.ok(await ST.methods.transfer(MC, diff).call({from: FOUNDATION}), "Transfer failed");
        AssertEvent(await ST.methods.transfer(MC, diff).send({
            from: FOUNDATION,
            gasPrice: coreConstants.OST_VALUE_GAS_PRICE
        }), "Transfer");
    }
    
    console.log("Unlock MC account", MC);
    await Geth.ValueChain.eth.personal.unlockAccount(MC);

    console.log("Check staking allowance of MC", MC);
    const CurrentAllowance = await ST.methods.allowance(MC, STAKE_CONTRACT).call({from: MC});
    console.log(" =", toST(CurrentAllowance) );
    if (new BigNumber(CurrentAllowance) != StakeSizeST) {

        if (CurrentAllowance != 0) {
            console.log(" Reset stake allowance to 0 ST");
            Assert.ok(await ST.methods.approve(STAKE_CONTRACT, 0).call({from: MC}), "approve failed");
            AssertEvent(await ST.methods.approve(STAKE_CONTRACT, 0).send({
                from: MC,
                gasPrice: coreConstants.OST_VALUE_GAS_PRICE
            }), "Approval");
        }

        console.log(" Init stake allowance to", diplayStakeSizeST, "ST");
        console.log(" =", diplayStakeSizeST);
        Assert.ok(await ST.methods.approve(STAKE_CONTRACT, StakeSizeST).call({from: MC}), "approve failed");
        console.log("Going for approval");
        AssertEvent(await ST.methods.approve(STAKE_CONTRACT, StakeSizeST).send({
            from: MC,
            gasPrice: coreConstants.OST_VALUE_GAS_PRICE
        }), "Approval");
        console.log("...Approval Received");
    }

    
    Assert.equal(await ST.methods.allowance(MC, STAKE_CONTRACT).call({from: MC}), StakeSizeST.toString(10));

    console.log("Increase the stake");
    Assert.notEqual(await Geth.ValueChain.eth.getCode(STAKE_CONTRACT), "0x");
    const stakeContract = new StakeContract(FOUNDATION, STAKE_CONTRACT);
    Assert.equal(await stakeContract._instance.methods.eip20Token().call(), SIMPLETOKEN_CONTRACT);

    console.log("Check Stake admin", stakeContract._admin);
    const stakeAdmin = await stakeContract._instance.methods.adminAddress().call();
    if ( !REGISTRAR.equalsIgnoreCase( stakeAdmin ) ) {
        console.log("Existing Admin Address is ", stakeAdmin);
        console.log("I should not be doing this ---->");
        console.log(" Seting the stake admin address to", stakeContract._admin);
        Assert.equalsIgnoreCase(await stakeContract._instance.methods.owner().call(), stakeContract._foundation);
        AssertEvent(await stakeContract._instance.methods.setAdminAddress(stakeContract._admin).send({
            from: stakeContract._foundation,
            gasPrice: coreConstants.OST_VALUE_GAS_PRICE
        }), "AdminAddressChanged");
        Assert.equalsIgnoreCase(await stakeContract._instance.methods.adminAddress().call(), stakeContract._admin);
    }

    console.log("Check stake transfer");
    Assert.ok(await ST.methods.transferFrom(MC, STAKE_CONTRACT, 1).call({from: STAKE_CONTRACT}), "transferFrom failed");

    console.log("....Transfer check passed.");

    const chainId = Member.ChainId;
    const ut = await stakeContract._instance.methods.utilityTokens(Member.UUID).call();
    if (Member.UUID === undefined || ut.stakingAccount == 0x0) {
        console.log("Register the UT on the value chain");
        console.log("Member.Reserve", Member.Reserve);
        Member.UUID = AssertEvent(await stakeContract.registerUtilityToken(Member.Symbol, Member.Name, Member.Decimals, Member.ConversionRate, chainId, MC), "UtilityTokenRegistered");
        console.log(" UUID =", Member.UUID);
    }
    else {
        console.log("Checking the UT on the value chain", Member.UUID);
    }

    const ut2 = await stakeContract._instance.methods.utilityTokens(Member.UUID).call();
    Assert.equal(ut2.chainId, chainId);
    Assert.equalsIgnoreCase(ut2.stakingAccount, MC);


    

    console.log("Stake", diplayStakeSizeST, "ST");
    const stakeTX = await stakeContract.stake(MC, Member.UUID, StakeSizeST);
    console.log("stakeTX" , JSON.stringify( stakeTX ) );

    AssertEvent(stakeTX, "MintingIntentDeclared");

    const stakeReturnValues     = stakeTX.events.MintingIntentDeclared.returnValues
          ,EscrowUnlockHeight   = stakeReturnValues._escrowUnlockHeight
          ,nonce                = stakeReturnValues._stakerNonce
          ,stakeUT              = stakeReturnValues._amountUT
          ,hashIntent           = stakeReturnValues._mintingIntentHash
    ;


    const bt = new BT(MC, Member.ERC20);
    console.log(" hashIntent =", hashIntent);
    // const hashIntent = await bt._btInstance.methods.hashMintingIntent(Member.UUID, MC, nonce, StakeSizeST, stakeUT, EscrowUnlockHeight).call();

    console.log("Confirm Minting Intent");
    AssertEvent(await bt.mint(Member.UUID, MC, nonce, StakeSizeST, stakeUT, EscrowUnlockHeight, hashIntent), "MintingIntentConfirmed");
    console.log("...Minting Intent Confirmed");

    console.log("Process Staking on ValueChain")
    const processStakingReturnValue = await stakeContract.processStaking(MC, Member.UUID, hashIntent);
    console.log("...Process Staking on ValueChain.");

    console.log("Unlock MC account on UtilityChain. MC Address : " , MC);
    await Geth.UtilityChain.eth.personal.unlockAccount( MC );
    console.log("...Unlock MC successfull");

    console.log("Process minting on UtilityChain");
    AssertEvent(await bt._btInstance.methods.processMinting(hashIntent).send({
        from: MC,
        gasPrice: coreConstants.OST_VALUE_GAS_PRICE
    }), "Minted");
    console.log("...Process minting on UtilityChain");

    console.log("Success.");
}

stake(Config.Members[ 0 ], new BigNumber(10).pow( 18 ).mul( 1 ) )
    .catch(err => {
        console.log(err.stack);
        process.exit(1);
    });








