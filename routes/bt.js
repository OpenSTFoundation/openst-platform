const Assert = require('assert');
const Express = require('express');
const RP = require('request');
const BigNumber = require('bignumber.js');
const Web3 = require('web3');

const reqPrefix     = ".."
      ,ERC20        = require(reqPrefix + '/lib/erc20contract')
      ,UtilityToken = require(reqPrefix + "/lib/contract_interact/UtilityToken")
      ,Stake        = require(reqPrefix + '/lib/stakeContract')
      ,web3         = new Web3()
;

//Old things. To be removed.
const BrandedTokenJson = require(reqPrefix + "/contracts/UtilityToken.json");
const BrandedTokenContract = BrandedTokenJson.contracts['UtilityToken.sol:UtilityToken'];




/** Construct a new route for a specific BT.
 * @param {object} erc20 The ERC20 token to manage.
 * @param {string} callbackUrl The callback URL for confirmed transactions.
 * @param {object?} callbackAuth Optional authentication object for callback requests.
 */
module.exports = function( member ) {
  const btContractInteract  = new UtilityToken( member )
        ,callbackUrl        = member.Callback
        ,callbackAuth       = member.CallbackAuth
  ;

//Old things. To be removed.
  const erc20 = new ERC20( member.Reserve, BrandedTokenContract, member.ERC20);


  Assert.ok(erc20 instanceof ERC20, `erc20 must be an instance of ERC20`);
  Assert.strictEqual(typeof callbackUrl, 'string', `callbackUrl must be of type 'string'`);

  const router = Express.Router();
  const auditLog = {};

  function addLog(user, obj) {
    Assert.strictEqual(typeof user, 'string', `user must be of type 'string'`);
    Assert.strictEqual(typeof obj, 'object', `obj must be of type 'object'`);

    if (!(user in auditLog)) {
      auditLog[user] = [];
    }
    auditLog[user].push(obj);
  }

  function addTransaction(body) {
    body.date = new Date;
    body.symbol = erc20.symbol;
    addLog(body.from || body.sender, body);
    addLog(body.to, body);
    // Add a 1 second delay before firing the callback (this needs pub-sub)
    // TODO: use rsmq
    RP.post({url: callbackUrl, json: true, body: body, auth: callbackAuth}, err => err ? console.error(err) : {} );
  }

  function toBigNumberWei( value ) {
    value = Number( value );
    Assert.strictEqual( isNaN( value ), false, `value must be of type 'Number'`);
    const weiValue = web3.utils.toWei( value,"ether");
    return new BigNumber( weiValue );
  }

  router.get('/owner', function(req, res, next) {
    btContractInteract.getOwner()
      .then( response => {
        res.json( response );   
      })
      .catch(next);
  });

  router.get('/name', function(req, res, next) {
    btContractInteract.getName()
      .then( response => {
        res.json( response );   
      })
      .catch(next);
  });

  router.get('/symbol', function(req, res, next) {
    btContractInteract.getSymbol()
      .then( response => {
        res.json( response );   
      })
      .catch(next);
  });

  router.get('/decimals', function(req, res, next) {
    btContractInteract.getDecimals()
      .then( response => {
        res.json( response );   
      })
      .catch(next);
  });

  router.get('/totalSupply', function(req, res, next) {
    btContractInteract.getTotalSupply()
      .then( response => {
        res.json( response );   
      })
      .catch(next);
  });

  router.get('/balanceOf', function(req, res, next) {
    const owner = req.query.owner;
    Promise.resolve(erc20.balanceOf(owner))
      .then(value => {
        console.log("value", value);
        var _val = web3.utils.fromWei( value, "ether" ).toString();
        res.json({data: _val});
      })
      .catch(next);
  });

  router.get('/transfer', function(req, res, next) {
    const sender = req.query.sender;
    const to = req.query.to;
    const value = Number(req.query.value);
    const tag = req.query.tag || "transfer";

    const bigWeiValue = toBigNumberWei( value );

    Promise.resolve(erc20.transfer(sender, to, bigWeiValue))
      .then(txid => {
        const log = {from: sender, to: to, value: bigWeiValue, tag: tag, txid: txid};
        res.json({data: txid});
        addTransaction(log);
      })
      .catch(next);
  });

  router.get('/transferFrom', function(req, res, next) {
    const sender = req.query.sender;
    const from = req.query.from;
    const to = req.query.to;
    const value = Number(req.query.value);
    const tag = req.query.tag || "transferFrom";

    const bigWeiValue = toBigNumberWei( value );
    console.log("bigWeiValue", bigWeiValue);

    Promise.resolve(erc20.transferFrom(sender, from, to, bigWeiValue))
      .then(txid => {
        const log = {from: from, to: to, value: bigWeiValue, tag: tag, txid: txid};
        res.json({data: txid});
        addTransaction(log);
      })
      .catch(next);
  });

  router.get('/approve', function(req, res, next) {
    const sender = req.query.sender;
    const spender = req.query.spender;
    const value = Number(req.query.value);
    const tag = req.query.tag || "approve";

    const bigWeiValue = toBigNumberWei( value );

    Promise.resolve(erc20.approve(sender, spender, bigWeiValue))
      .then(txid => {
        const log = {sender: sender, to: spender, value: bigWeiValue, tag: tag, txid: txid};
        res.json({data: txid});
        addTransaction(log);
      })
      .catch(next);
  });

  router.get('/allowance', function(req, res, next) {
    const owner = req.query.owner;
    const spender = req.query.spender;

    Promise.resolve(erc20.allowance(owner, spender))
      .then(value => {
        var _val = web3.utils.fromWei( value, "ether" ).toString();
        res.json({data: _val});
      })
      .catch(next);
  });

  router.get('/log', function(req, res, next) {
    const owner = req.query.owner;
    res.json({data: auditLog[owner] || []});
  });

  router.get('/getAllTxDetails', function(req, res, next) { 
    res.json( erc20.getAllTxDetails() );
    next();
  });

  router.get('/newkey', function(req, res, next) {
    Geth.UtilityChain.eth.personal.newAccount().then(x => {
        res.json({data: x});
    })
    .catch(next);
  });

  return router;
}
