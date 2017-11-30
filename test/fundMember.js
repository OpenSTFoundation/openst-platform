const FS = require('fs');
const Path = require('path');
const BigNumber = require('bignumber.js');


const rootPrefix = ".."
  , SimpleToken   = require( rootPrefix + '/lib/simpleTokenContract')
  , coreConstants = require( rootPrefix + '/config/core_constants')
  , coreAddresses = require( rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  , Config = require(rootPrefix + '/config.json')
  , web3Utility = require(rootPrefix+"/lib/web3/providers/utility_rpc")
  , web3Value = require(rootPrefix+"/lib/web3/providers/value_rpc")
  , FOUNDATION = coreAddresses.getAddressForUser('foundation')
  , MIN_FUND = new BigNumber( 10 ).pow( 18 )
;

var ST = null;
function initST() {
  if ( ST ) {
    return ST;
  }
  //Create an instance of SimpleToken class.
  ST = new SimpleToken({
    from: FOUNDATION
  });
  return ST;
}


function fundMember( member ) {
  const grantInST = new BigNumber( 100 );
  const grant = new BigNumber(10).pow( 18 ).mul( grantInST ).toString( 10 );
  logger.info("member.Reserve:", member.Reserve);
  return fundAddressOnValueChain(member.Reserve, member.Name)
    .then(_ =>{
      return fundAddressOnUtilityChain(member.Reserve, member.Name);
    })
    .then(_ => {
      logger.step("Grant", member.Name, "with" , grantInST.toString( 10 ), "ST");
      return ST.methods.transfer( member.Reserve, grant.toString( 10 ) ).send({
        from: FOUNDATION,
        gasPrice: coreConstants.OST_VALUE_GAS_PRICE
      });
    })
    .then(_ => {
      logger.win(member.Name, "has been granted with", grantInST.toString( 10 ), "ST");
    });
  ;
}
function fundAddress(Chain, chainName, accountAddress, addressName ) {
  addressName = addressName || "Address";
  logger.info("Fetch",addressName,"balance on",chainName);
  return Chain.eth.getBalance( accountAddress )
    .catch( reason =>  {
      logger.error("Failed to fund ", addressName);
      throw reason;
    })
    .then(balance => {
      logger.info(addressName, "has", balance,"on",chainName);

      const bigBalance = new BigNumber( balance );
      //See how many funds are needed.
      const diff = MIN_FUND.minus( bigBalance );

      if ( diff.greaterThan( 0 ) ) {
        return Chain.eth.personal.unlockAccount(FOUNDATION, "testtest")
        .catch( reason =>  {
          logger.error("Failed to deploy unlockAccount SimpleTokenFoundation on", chainName);
        })
        .then(_ => {
          //Transfer the funds.
          return Chain.eth.sendTransaction({
            from: FOUNDATION, 
            to: accountAddress, 
            value: diff.toString( 10 ) 
          })
          .catch( reason =>  {
            logger.error("Failed to transfer funds to ", addressName, "on", chainName);
          })
          .then( _ => {
            logger.win(addressName,"has been transfered",diff.toString( 10 ),"on", chainName );
          });
        });
      } else {
        logger.win(addressName,"has sufficient funds on", chainName);
      }
    });
}
function fundAddressOnValueChain( accountAddress, addressName ) {
  return fundAddress(web3Value,"ValueChain", accountAddress, addressName);
}
function fundAddressOnUtilityChain( accountAddress, addressName ) {
  return fundAddress(web3Utility,"UtilityChain", accountAddress, addressName);
}


var IS_RUN_FROM_CONSOLE = false;

(async function () {
  initST();

  var initiatorFile =  process.argv[ 1 ] ? String(process.argv[ 1 ]).toLowerCase() : "";
  if ( !initiatorFile.endsWith("/test/fundmember.js") ) {
    module.exports = fundMember;
    return;
  }

  IS_RUN_FROM_CONSOLE = true;

  logger.step("FOUNDATION:" , FOUNDATION);
  

  if ( process.argv[ 2 ] && String(process.argv[ 2 ]).length > 0 ) {
    
    const inAddress = String(process.argv[ 2 ]);
    if ( inAddress.toLowerCase() === "allinconfig") {
      return Promise.all( Config.Members.map( fundMember ) )
        .then(_ => {
          logger.win("Done!");
          process.exit(0);
        })
        .catch(reason => {
          logger.error( JSON.stringify( reason ) );
          process.exit(1);
        });
    } else {
      return fundMember({ Name: "Address", Reserve: inAddress })
        .then(_ => {
          logger.win("Done!");
          process.exit(0);
        })
        .catch(reason => {
          logger.error( JSON.stringify( reason ) );
          process.exit(1);
        });
    }
  } else {
    console.log("Usage: node fundMember 0x73b51e21b5e5791bdd39355f9c24795934ddad95");
  }

  console.log("Done!");
  

})();