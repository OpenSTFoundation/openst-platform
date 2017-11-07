const FS = require('fs');
const Path = require('path');

const BT = require('../lib/bt');
const StakeContract = require('../lib/stakeContract');
const Geth = require("../lib/geth");

const SimpleTokenJson = require("../contracts/SimpleToken.json");
const Config = require(process.argv[2] || '../config.json');


function deployST() {

    const ST = "ST";
    // const ST_INFO_PRE = "" + ST;
    // const ST_INFO_POST = "\x1b[0m";

    // const ST_STEP_START_PRE = "\x1b[36m" + ST;
    // const ST_STEP_START_POST = "..." + "\x1b[0m";

    // const ST_STEP_INFO_PRE = "\x1b[32m" + ST;
    // const ST_STEP_INFO_POST = "\x1b[0m";

    // const ST_STEP_END_PRE =  "\x1b[36m...";
    // const ST_STEP_END_POST = "\x1b[0m";


    const ST_INFO_PRE = "" + ST;
    const ST_INFO_POST = "";

    const ST_STEP_START_PRE =  ST;
    const ST_STEP_START_POST = "..."

    const ST_STEP_INFO_PRE = ST;
    const ST_STEP_INFO_POST = "";

    const ST_STEP_END_PRE =  "...";
    const ST_STEP_END_POST = "";

    const VC_NAME = "Ethereum";

    console.log(ST_INFO_PRE, "SimpleTokenFoundation @", Config.SimpleTokenFoundation, ST_INFO_POST);

    console.log(ST_STEP_START_PRE, "Get SimpleTokenFoundation Balance",ST_STEP_START_POST);
    return Geth.ValueChain.eth.getBalance(Config.SimpleTokenFoundation)
        .then(balance => {
            console.log(ST_STEP_INFO_PRE, "Balance of SimpleTokenFoundation =", balance, ST_STEP_INFO_POST);
            console.log(ST_STEP_END_PRE, "Get SimpleTokenFoundation Balance", ST_STEP_END_POST);

            console.log(ST_STEP_START_PRE, "Deploying SimpleToken on", VC_NAME, ST_STEP_START_POST);
            return Geth.ValueChain.deployContract(
                Config.SimpleTokenFoundation,
                SimpleTokenJson.contracts['SimpleToken.sol:SimpleToken'],
                Config.ValueChain.SimpleToken);
        })
        .then(simpleToken => {
            if (simpleToken === Config.ValueChain.SimpleToken) {
                console.log(ST, "Skipped: contract body unchanged; constructor/args might have changed though!");
            }
            console.log(ST, "SimpleToken @", simpleToken);
            const stchanged = Config.ValueChain.SimpleToken !== simpleToken;
            Config.ValueChain.SimpleToken = simpleToken;

            console.log("SK", "Deploying Staking on",VC_NAME, stchanged ? "(forced)" : "");
            return new StakeContract(Config.SimpleTokenFoundation, stchanged ? 0x0 : Config.ValueChain.Stake)
                .deploy(simpleToken);
        })
        .then(stake => {
            if (stake === Config.ValueChain.Stake) {
                console.log("SK", "Skipped: contract body unchanged; constructor/args might have changed though!");
            }
            console.log("SK", "@", stake);
            Config.ValueChain.Stake = stake;
        })
        .then(function () {
            console.log("Starting deployMember");
            Promise.all(Config.Members.map(deployMember))
            .then(_ => {
                const json = JSON.stringify(Config, null, 4);
                console.log(json);
                return new Promise( (resolve,reject) =>
                    FS.writeFile(Path.join(__dirname, '/../config.json'), json, err => err ? reject(err) : resolve() )
                );
            })
            .catch(err => {
                console.error(err.stack);
                process.exit(1);
            });
        })
}


function deployMember(member) {

    return Geth.ValueChain.eth.getBalance(member.Reserve)
        .then(balance => {
            console.log("deployMember :: " , member.Symbol, "ValueChain Balance of", member.Name, "=", balance);
            if (balance > 0) {
                return {};
            }
            console.log(member.Symbol, "Funding", member.Name, "on ValueChain...");
            return Geth.ValueChain.eth.personal.unlockAccount(Config.SimpleTokenFoundation)
                // unlockAccount always fails under testrpc
                .catch(err => console.error(member.Symbol, err.message || err))
                .then(_ => {
                    console.log("Geth.ValueChain.eth.sendTransaction _______ :: ");
                    return Geth.ValueChain.eth.sendTransaction({from: Config.SimpleTokenFoundation, to: member.Reserve, value: "1000000000000"})
                })
            ;
        })
        .then(_ => {
            return Geth.UtilityChain.eth.getBalance(member.Reserve)
                .then(balance => {
                    console.log("deployMember :: " , member.Symbol, "UtilityChain Balance of", member.Name, "=", balance);
                    if (balance > 0) {
                        return {};
                    }
                    console.log(member.Symbol, "Funding", member.Name, "on UtilityChain...");
                    return Geth.UtilityChain.eth.personal.unlockAccount(Config.SimpleTokenFoundation)
                        .catch(err => console.error(member.Symbol, err.message || err))
                        .then(_ => {
                            return Geth.UtilityChain.eth.sendTransaction({from: Config.SimpleTokenFoundation, to: member.Reserve, value: "1000000000000"})
                        })
                })
        })
        .then(_ => {
            console.log(member.Symbol, "Deploying", member.Symbol, "on side-chain...");
            return new BT(member.Reserve, member.ERC20)
                .deploy(member.Symbol, member.Name, member.Decimals, member.ChainId);
        })
        .then(address => {
            if (address === member.ERC20) {
                console.log(member.Symbol, "Skipped: contract body unchanged; constructor/args might have changed though!");
            }
            console.log(member.Symbol, member.Name, "@", address);
            console.log("--------------------------ERC20");
            console.log(address);
            console.log("--------------------------");

            member.ERC20 = address;
            return new BT(member.Reserve, address).uuid();
        })
        .then(uuid => {
            console.log(member.Symbol, "uuid =", uuid);
            console.log("--------------------------UUID");
            console.log(uuid);
            console.log("--------------------------");
            member.UUID = uuid;
        })
        .catch(err => {
            console.log(member.Symbol, err.message||err);
        });
}


// Run all deployments in parallel
deployST();

// NOTE: Member deployment is triggered at the end of deployST.

// Promise.all(Config.Members.map(deployMember))
//     .then(_ => {
//         const json = JSON.stringify(Config, null, 4);
//         console.log(json);
//         return new Promise( (resolve,reject) =>
//             FS.writeFile(Path.join(__dirname, '/../config.json'), json, err => err ? reject(err) : resolve() )
//         );
//     })
//     .catch(err => {
//         console.error(err.stack);
//         process.exit(1);
//     });
