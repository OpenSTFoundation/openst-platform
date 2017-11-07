"use strict";
/*
 * transfer event from BrandedTokenContract
 *
 * * Author: Rachin Kapoor
 * * Date: 05/11/2017
 * * Reviewed by: 
 */
const BigNumber = require('bignumber.js');

const Web3 = require("web3")
      ,reqPrefix = "../.."
      ,Config = require( reqPrefix + "/config.json")
      ,Geth = require(reqPrefix + "/lib/geth")
      ,web3WsProvider = new Web3( "ws://localhost:18546" ) /* UtilityChain WebSocket Address */
      ,contractAbiJson = require(reqPrefix + "/contracts/UtilityToken.json")
      ,contractAbi = JSON.parse( contractAbiJson.contracts["UtilityToken.sol:UtilityToken"].abi )
      // ,abiDecoder = require('abi-decoder')
;



// abiDecoder.addABI( contractAbi )

const toST = function ( num ) {
  var bigNum = new BigNumber( num );
  var fact = new BigNumber( 10 ).pow( 18 );
  return bigNum.dividedBy( fact ).toString();
}

const logJSObject = function ( jo , heading ) {
  console.log("*****\t", heading);
  if ( jo && jo instanceof Object ) {
    console.log( JSON.stringify(jo, null, 2) );
  } else {
    console.log( jo );
  }
};

const generateEventCallback = function ( displayName, colorCode ) {
  return function( e, res) {
    if ( !res ) { return; }
    const eventName = res.event || "";
    console.log("\n" + colorCode + "==== " + displayName + " :: " + eventName + " ====\x1b[0m");
    switch( eventName ) {
      case "Transfer": 
        showTransferEventDescription( res );
        break;
      case "Minted":
        showMintedEventDescription( res );
        break;
      case "MintingIntentConfirmed":
        showMintingIntentConfirmedDescription( res );
        break;
    }
    logJSObject( res,"Event Result\t TransactionHash :: " + res.transactionHash );
  };
};

const showMintedEventDescription = function ( result ) {

  var returnValues = result.returnValues;
  console.log("\x1b[33mEvent Description ");
  console.log("Event:\t\t", result.event);
  console.log("Account:\t", getDisplayForAddress( returnValues._account ).displayName );
  console.log("Amount:\t\t", toST( returnValues._amount ) );
  console.log("Balance:\t", toST(returnValues._balance) );
  console.log("Total Supply:\t", toST(returnValues._totalSupply) );
  console.log("Description: Pepo Company signed to accept newly minted PepoCoin"); 
  console.log( "\x1b[0m" );

};

const showMintingIntentConfirmedDescription = function ( result ) {
  var returnValues = result.returnValues;
  console.log("\x1b[33mEvent Description ");
  console.log("Event:\t\t", result.event);
  console.log("Account:\t\t", getDisplayForAddress( returnValues._uuid ).displayName );
  console.log("Minting Intent Hash:\t", returnValues._mintingIntentHash);
  console.log("Description: OpenST Foundation confirmed the minting intent of Pepo Company"); 
  console.log( "\x1b[0m" );
}

const showTransferEventDescription = function ( result ) {

  var returnValues = result.returnValues
      ,_from = returnValues._from
      ,_to = returnValues._to
      ,_value = returnValues._value
      ,fromDisplayInfo, toDisplayInfo
      ,description = ""
  ;

  fromDisplayInfo = getDisplayForAddress( _from );
  toDisplayInfo = getDisplayForAddress( _to );
  
  console.log("\x1b[33mEvent Description ");
  console.log("Event:\t\t", result.event);
  console.log("From:\t\t" , fromDisplayInfo.displayName);
  console.log("To:\t\t", toDisplayInfo.displayName);
  console.log("Amount:\t\t", toST(_value) , "[PC]");
  if ( !fromDisplayInfo.isKnown && !toDisplayInfo.isKnown ) {
    description = "Pepo User upvoted a message and transferred "+ toST(_value) +" PepoCoin to the author";
  } else if ( fromDisplayInfo.isKnown && !toDisplayInfo.isKnown ) {
    description = "Pepo Company granted Pepo User with "+ toST(_value) +"[PC] PepoCoin";
  }

  description.length && console.log("Description:\t", description);
  console.log( "\x1b[0m" );
};

const displayMap = {};

//Build Display Map
(function () {
  var _key;

  _key = Config.SimpleTokenFoundation;
  displayMap[ _key.toLowerCase() ] = {
    isKnown: true,
    configKey: "SimpleTokenFoundation",
    displayName: "SimpleToken Foundation"
  };

  Config.Members.forEach( function ( Member ) {
    var name = Member.Name;
    _key = Member.Reserve;
    displayMap[ _key.toLowerCase() ] = {
      isKnown: true,
      configKey: "Reserve",
      displayName: name + " " + "Company"
    };

    _key = Member.ERC20;
    displayMap[ _key.toLowerCase() ] = {
      isKnown: true,
      configKey: "ERC20",
      displayName: name + " " + "(ERC20)"
    };

    _key = Member.UUID;
    displayMap[ _key.toLowerCase() ] = {
      isKnown: true,
      configKey: "UUID",
      displayName: name
    };

  });

  Object.keys( Config.ValueChain ).forEach( function(configKey ) {
    _key = Config.ValueChain[ configKey ];
    displayMap[ _key.toLowerCase() ] = { 
      isKnown: true,
      configKey: configKey,
      displayName: configKey
    }
  });


})();

const getDisplayForAddress = function ( address ) {
  address = address || "";
  address = address.toLowerCase();
  return displayMap[ address ] || {
    isKnown: false,
    configKey: "NA", 
    displayName: "Pepo User (" + address + ")"
  };
};

var lastCallback;
const bindBrandedTokenEvents = function() {
  Config.Members.forEach( function ( Member ) {
    const memberName = Member.Name
          ,memberContractAddress = Member.ERC20
          ,memberColorCode = "\x1b[32m"
          ,contract = new web3WsProvider.eth.Contract(contractAbi, memberContractAddress)
          ,callback = generateEventCallback( memberName, memberColorCode)
    ;
    contract.events.allEvents({} , callback);
    lastCallback = callback;
  });
};

bindBrandedTokenEvents();
// // Test MintingIntentConfirmed
// lastCallback( null, {
//   "address": "0xA99bf87ea3F515B046683c7e205c1E296D199d55",
//   "blockNumber": 521979,
//   "transactionHash": "0xd184412bd5baea1c112cc4205ba5de0271224b051b7f3198005bbaa39b7d7aa8",
//   "transactionIndex": 0,
//   "blockHash": "0x5a3935f4c4f05f53160b726ec77ac26260430560f834fe494371788cca420b92",
//   "logIndex": 0,
//   "removed": false,
//   "id": "log_be4a0bc3",
//   "returnValues": {
//     "0": "0xcf87fc52579cecea336750bbfbb5afcb096d445ee74a1c40cc88f78f7e3025b3",
//     "1": "0x2aa3c8dd3d331cbc3d32d95b624cb1468aa08e3014f1a47a4ad86ccf2d794a5a",
//     "_uuid": "0xcf87fc52579cecea336750bbfbb5afcb096d445ee74a1c40cc88f78f7e3025b3",
//     "_mintingIntentHash": "0x2aa3c8dd3d331cbc3d32d95b624cb1468aa08e3014f1a47a4ad86ccf2d794a5a"
//   },
//   "event": "MintingIntentConfirmed",
//   "signature": "0x584a0daa4608323e9dc5b9e5d8b16827adaf70b15779009b81e1fe42eaa9e07a",
//   "raw": {
//     "data": "0x2aa3c8dd3d331cbc3d32d95b624cb1468aa08e3014f1a47a4ad86ccf2d794a5a",
//     "topics": [
//       "0x584a0daa4608323e9dc5b9e5d8b16827adaf70b15779009b81e1fe42eaa9e07a",
//       "0xcf87fc52579cecea336750bbfbb5afcb096d445ee74a1c40cc88f78f7e3025b3"
//     ]
//   }
// });

// // // Test Minted
// lastCallback( null, {
//   "address": "0xA99bf87ea3F515B046683c7e205c1E296D199d55",
//   "blockNumber": 520290,
//   "transactionHash": "0x44d39d218541f3e440ab52d7d738a4e4f095b749497e39062af16f98cacaf10b",
//   "transactionIndex": 0,
//   "blockHash": "0xc46077eec9e19ecfe6ad03bd15f691e308bc6176c13c7ff15089053de24bc244",
//   "logIndex": 0,
//   "removed": false,
//   "id": "log_135138fb",
//   "returnValues": {
//     "0": "0xcf87fc52579cecea336750bbfbb5afcb096d445ee74a1c40cc88f78f7e3025b3",
//     "1": "0x6Ed7472dBf085D1B17a19e32e3483D4017C4fc40",
//     "2": "10000000000000000000",
//     "3": "59999999999999998900",
//     "4": "60000000000000000000",
//     "_uuid": "0xcf87fc52579cecea336750bbfbb5afcb096d445ee74a1c40cc88f78f7e3025b3",
//     "_account": "0x6Ed7472dBf085D1B17a19e32e3483D4017C4fc40",
//     "_amount": "10000000000000000000",
//     "_balance": "59999999999999998900",
//     "_totalSupply": "60000000000000000000"
//   },
//   "event": "Minted",
//   "signature": "0xb1772aa720595ec1d1f134bc749e5adfa177b4750052e551a6b84953705a19f4",
//   "raw": {
//     "data": "0x0000000000000000000000000000000000000000000000008ac7230489e8000000000000000000000000000000000000000000000000000340aad21b3b6ffbb400000000000000000000000000000000000000000000000340aad21b3b700000",
//     "topics": [
//       "0xb1772aa720595ec1d1f134bc749e5adfa177b4750052e551a6b84953705a19f4",
//       "0xcf87fc52579cecea336750bbfbb5afcb096d445ee74a1c40cc88f78f7e3025b3",
//       "0x0000000000000000000000006ed7472dbf085d1b17a19e32e3483d4017c4fc40"
//     ]
//   }
// });


// // // Test Grant
// lastCallback(null, {
//   "address": "0xA99bf87ea3F515B046683c7e205c1E296D199d55",
//   "blockNumber": 517546,
//   "transactionHash": "0x3268f92420d93e499a021fa2cb71f461ad6cf6343fabec09c3ba04831bd9cf78",
//   "transactionIndex": 0,
//   "blockHash": "0x9c751b115046aee65f2a85dd43b6bb3e448e54517dd692561bd52cda6e83f198",
//   "logIndex": 0,
//   "removed": false,
//   "id": "log_5f7390c6",
//   "returnValues": {
//     "0": "0x6Ed7472dBf085D1B17a19e32e3483D4017C4fc40",
//     "1": "0x40C5790BE3C401baF405aF9f143235e318B98Ec0",
//     "2": "1000",
//     "_from": "0x6Ed7472dBf085D1B17a19e32e3483D4017C4fc40",
//     "_to": "0x40C5790BE3C401baF405aF9f143235e318B98Ec0",
//     "_value": "1000"
//   },
//   "event": "Transfer",
//   "signature": "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
//   "raw": {
//     "data": "0x00000000000000000000000000000000000000000000000000000000000003e8",
//     "topics": [
//       "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
//       "0x0000000000000000000000006ed7472dbf085d1b17a19e32e3483d4017c4fc40",
//       "0x00000000000000000000000040c5790be3c401baf405af9f143235e318b98ec0"
//     ]
//   }
// });


// // // Test Up-Vote
// lastCallback(null, {
//   "address": "0xA99bf87ea3F515B046683c7e205c1E296D199d55",
//   "blockNumber": 517437,
//   "transactionHash": "0x59474d254c5de53260fc848a02cb6b557e7270b016cdf29869d5115a91fd29a1",
//   "transactionIndex": 0,
//   "blockHash": "0x058001d8a850a0f703651535ade391df80b07cf8950cf24d0bda4179b83142cd",
//   "logIndex": 0,
//   "removed": false,
//   "id": "log_353b1d1c",
//   "returnValues": {
//     "0": "0x40C5790BE3C401baF405aF9f143235e318B98Ec0",
//     "1": "0x8DB8027982EBEbfA7f001ABfC95931Ae39ec7f65",
//     "2": "3",
//     "_from": "0x40C5790BE3C401baF405aF9f143235e318B98Ec0",
//     "_to": "0x8DB8027982EBEbfA7f001ABfC95931Ae39ec7f65",
//     "_value": "3"
//   },
//   "event": "Transfer",
//   "signature": "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
//   "raw": {
//     "data": "0x0000000000000000000000000000000000000000000000000000000000000003",
//     "topics": [
//       "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
//       "0x00000000000000000000000040c5790be3c401baf405af9f143235e318b98ec0",
//       "0x0000000000000000000000008db8027982ebebfa7f001abfc95931ae39ec7f65"
//     ]
//   }
// });





