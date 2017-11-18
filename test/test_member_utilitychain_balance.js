const Assert = require('assert');
const Config = require('../config.json');
const Geth = require('../lib/geth');
const BigNumber = require('bignumber.js');

/*  check UtilityToken balance of Member Company
    @param {object} Member - Member object from Config. E.g. Config.Members[0]
*/
const toDisplayST = function ( num ) {
  var bigNum = new BigNumber( num );
  var fact = new BigNumber( 10 ).pow( 18 );
  return bigNum.dividedBy( fact ).toString( 10 ) + " ST";
}

async function checkMemberBalance( Member ) {
    const MC = Member.Reserve;
    const UtilityTokenJson = require("../contracts/UtilityToken.json");
    const abi = JSON.parse(UtilityTokenJson.contracts["UtilityToken.sol:UtilityToken"].abi);

    const UtilityTokenContract =  new Geth.UtilityChain.eth.Contract(abi, Member.ERC20);
    UtilityTokenContract.setProvider(Geth.UtilityChain.currentProvider);

    const _out = await UtilityTokenContract.methods.balanceOf( MC ).call();


    console.log("balance" , toDisplayST( _out) );
}

checkMemberBalance( Config.Members[0] )
    .catch(err => {
        console.log(err.stack);
        process.exit(1);
    });


