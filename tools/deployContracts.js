const FS = require('fs');
const Path = require('path');

const BT = require('../lib/bt');
const StakeContract = require('../lib/stakeContract');
const Geth = require("../lib/geth");

const SimpleTokenJson = require("../contracts/SimpleToken.json");
const Config = require(process.argv[2] || '../config.json');


function deployMember(member) {

    return Geth.ValueChain.eth.getBalance(member.Reserve)
        .then(balance => {
            console.log("Balance of", member.Name, "=", balance);
            if (balance > 0) {
                return {};
            }
            console.log("Funding", member.Name, "on value-chain...");
            return Geth.ValueChain.eth.personal.unlockAccount(Config.SimpleTokenFoundation)
                .then(_ => {
                    return Geth.ValueChain.eth.sendTransaction({from: Config.SimpleTokenFoundation, to: member.Reserve, value: "1000000000000"})
                });
        })
        .then(_ => {
            console.log("Deploying", member.Symbol, "on side-chain...");
            return new BT(member.Reserve, member.ERC20)
                .deploy(member.Symbol, member.Name, member.Decimals, member.ChainId);
        })
        .then(address => {
            console.log(member.Name, member.Symbol, "@", address);
            member.ERC20 = address;
            return new BT(member.Reserve, address).uuid();
        })
        .then(uuid => {
            console.log(" uuid =", uuid);
        });
}


Promise.resolve()
    .then(_ => {
        console.log("Deploying SimpleToken on Ethereum...");

        return Geth.ValueChain.deployContract(
            Config.SimpleTokenFoundation,
            SimpleTokenJson.contracts['SimpleToken.sol:SimpleToken'],
            Config.ValueChain.SimpleToken);
    })
    .then(simpleToken => {
        console.log("SimpleToken ST @", simpleToken);
        Config.ValueChain.SimpleToken = simpleToken;

        console.log("Deploying Staking on Ethereum...");

        return new StakeContract(Config.SimpleTokenFoundation, Config.ValueChain.Stake)
            .deploy(simpleToken);
    })
    .then(stake => {
        console.log("Staking @", stake);
        Config.ValueChain.Stake = stake;

        return Promise.all(Config.Members.map(deployMember));
    })
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
