const Assert  = require("assert")
  , Express   = require("express")
  , RP        = require("request")
  , BigNumber = require("bignumber.js")
;

const reqPrefix         = ".."
  , BTContractInteract  = require(reqPrefix + "/lib/contract_interact/branded_token")
  , responseHelper      = require(reqPrefix + "/lib/formatter/response")
  , TransactionLogger   = require(reqPrefix + "/helpers/transactionLogger")
  , logger = require(reqPrefix + '/helpers/custom_console_logger')
;

/** Construct a new route for a specific BT.
 * @param {object} erc20 The ERC20 token to manage.
 * @param {string} callbackUrl The callback URL for confirmed transactions.
 * @param {object?} callbackAuth Optional authentication object for callback requests.
 * @param {object?} Worker obj for logging purpose
 */
module.exports = function( member ) {
  const btContractInteract  = new BTContractInteract( member )
    , callbackUrl           = member.Callback
    , callbackAuth          = member.CallbackAuth
    , memberSymbol          = member.Symbol
    , web3                  = btContractInteract.getWeb3Provider()
  ;

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
    if ( !callbackUrl ) {
      return;
    }
    body.date = new Date;
    body.symbol = erc20.symbol;
    addLog(body.from || body.sender, body);
    addLog(body.to, body);
    // Add a 1 second delay before firing the callback (this needs pub-sub)
    // TODO: use rsmq
    RP.post({url: callbackUrl, json: true, body: body, auth: callbackAuth}, err => err ? console.error(err) : {} );
  }

  function toBigNumberWei( stringValue ) {
    var value = Number( stringValue );
    Assert.strictEqual( isNaN( value ), false, `value must be of type 'Number'`);

    if ( typeof stringValue != 'string' ) {
      stringValue = String( stringValue );
    }

    const weiValue = web3.utils.toWei( stringValue, "ether");
    return new BigNumber( weiValue );
  }

  function toETHfromWei( stringValue ) {
    if ( typeof stringValue != 'string' ) {
      stringValue = String( stringValue );
    }
    return web3.utils.fromWei( stringValue, "ether" );
  }

  router.get('/', function(req, res, next) {
    const rootResponse = responseHelper.successWithData({});
    rootResponse.renderResponse( res );
  });

  function appendRequestInfo(req) {
    logger.info(`[req-${req.id}]`)
  }

  router.get('/reserve', function(req, res, next) {
    appendRequestInfo(req);
    btContractInteract.getReserve()
      .then( response => {
        response.renderResponse( res );
      })
      .catch(next);
  });

  router.get('/name', function(req, res, next) {
    appendRequestInfo(req);
    btContractInteract.getName()
      .then( response => {
        console.log( "then.response", JSON.stringify( response ) );
        response.renderResponse( res );
      })
      .catch( reason => {
        console.log( "catch.reason", reason.message );
        throw reason;
      })
      .catch(next);
  });

  router.get('/uuid', function(req, res, next) {
    appendRequestInfo(req);
    btContractInteract.getUuid()
      .then( response => {
        console.log( "then.response", JSON.stringify( response ) );
        response.renderResponse( res );
      })
      .catch( reason => {
        console.log( "catch.reason", reason.message );
        throw reason;
      })
      .catch(next);
  });


  router.get('/symbol', function(req, res, next) {
    appendRequestInfo(req);
    btContractInteract.getSymbol()
      .then( response => {
        response.renderResponse( res );
      })
      .catch(next);
  });

  router.get('/decimals', function(req, res, next) {
    appendRequestInfo(req);
    btContractInteract.getDecimals()
      .then( response => {
        response.renderResponse( res );
      })
      .catch(next);
  });

  router.get('/totalSupply', function(req, res, next) {
    appendRequestInfo(req);
    btContractInteract.getTotalSupply()
      .then( response => {
        if ( response && response.data && response.data.totalSupply ) {
          response.data.totalSupply = toETHfromWei( response.data.totalSupply);
          response.data.unit = memberSymbol;
        }
        response.renderResponse( res ); 
      })
      .catch(next);
  });

  router.get('/allowance', function(req, res, next) {
    appendRequestInfo(req);
    const owner = req.query.owner;
    const spender = req.query.spender;

    btContractInteract.getAllowance(owner, spender)
      .then( response => {
        if ( response && response.data && response.data.allowance ) {
          response.data.allowance = toETHfromWei( response.data.allowance, "ether" );
        }
        response.renderResponse( res );   
      })
      .catch(next);
  });

  router.get('/balanceOf', function(req, res, next) {
    appendRequestInfo(req);
    const owner = req.query.owner;

    btContractInteract.getBalanceOf(owner)
      .then( response => {
        if ( response && response.data && response.data.balance ) {
          response.data.balance = toETHfromWei( response.data.balance, "ether" );
          response.data.unit = memberSymbol;
          response.data.owner = owner;
        }
        response.renderResponse( res );
      })
      .catch(next);
  });

  router.get('/newkey', function(req, res, next) {
    appendRequestInfo(req);
    btContractInteract.newUserAccount()
      .then( response => {
        response.renderResponse( res );
      })
      .catch(next);
    //
  });

  router.get('/transfer', function(req, res, next) {
    appendRequestInfo(req);
    const sender = req.query.sender;
    const recipient = req.query.to;
    const amount = String(req.query.value);
    const tag = req.query.tag || "transfer";

    const amountInWei = toBigNumberWei( amount );

    btContractInteract.transfer(sender, recipient, amountInWei, tag)
      .then( response => {
        if ( response && response.data && response.data.amount ) {
          response.data.amount = toETHfromWei( response.data.amount, "ether" );
          response.data.unit = memberSymbol;
        }
        response.renderResponse( res );
      })
      .catch(next)
    ;
  });

  router.get('/transaction-logs', function(req, res, next) {
    appendRequestInfo(req);
    const transactionUUID = req.query.transactionUUID;

    new Promise( (resolve, reject) => {
       TransactionLogger.getTransactionLogs(memberSymbol, transactionUUID, resolve);   
    })
      .then( response => {
        response.renderResponse( res );
      })
      .catch(next)
    ;
  });

  router.get('/failed-transactions', function(req, res, next) {
    appendRequestInfo(req);
    new Promise( (resolve, reject) => {
       TransactionLogger.getFailedTransactions(memberSymbol, resolve);   
    })
      .then( response => {
        response.renderResponse( res );
      })
      .catch(next)
    ;
  });

  router.get('/pending-transactions', function(req, res, next) {
    appendRequestInfo(req);
    new Promise( (resolve, reject) => {
       TransactionLogger.getPendingTransactions(memberSymbol, resolve);   
    })
      .then( response => {
        response.renderResponse( res );
      })
      .catch(next)
    ;
  });

  // router.get('/transferFrom', function(req, res, next) {
  //   const sender = req.query.sender;
  //   const from = req.query.from;
  //   const to = req.query.to;
  //   const value = Number(req.query.value);
  //   const tag = req.query.tag || "transferFrom";

  //   const bigWeiValue = toBigNumberWei( value );
  //   console.log("bigWeiValue", bigWeiValue);

  //   Promise.resolve(erc20.transferFrom(sender, from, to, bigWeiValue))
  //     .then(txid => {
  //       const log = {from: from, to: to, value: bigWeiValue, tag: tag, txid: txid};
  //       res.json({data: txid});
  //       addTransaction(log);
  //     })
  //     .catch(next);
  // });

  // router.get('/approve', function(req, res, next) {
  //   const sender = req.query.sender;
  //   const spender = req.query.spender;
  //   const value = Number(req.query.value);
  //   const tag = req.query.tag || "approve";

  //   const bigWeiValue = toBigNumberWei( value );

  //   Promise.resolve(erc20.approve(sender, spender, bigWeiValue))
  //     .then(txid => {
  //       const log = {sender: sender, to: spender, value: bigWeiValue, tag: tag, txid: txid};
  //       res.json({data: txid});
  //       addTransaction(log);
  //     })
  //     .catch(next);
  // });



  // router.get('/log', function(req, res, next) {
  //   const owner = req.query.owner;
  //   res.json({data: auditLog[owner] || []});
  // });

  // router.get('/getAllTxDetails', function(req, res, next) { 
  //   res.json( erc20.getAllTxDetails() );
  //   next();
  // });



  return router;
}
