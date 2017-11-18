"use strict";
/*
 * Simple Token Contract Class.
 *
 * * Author: Rachin Kapoor
 * * Date: 10/10/2017
 * * Description: SimpleToken is a derived class of Geth.ValueChain.eth.Contract.
 * * Reviewed by:
 * * 
 */

const Assert = require('assert');
const Geth = require('./geth');
const coreConstants = require('../config/core_constants')
      ,FOUNDATION = coreConstants.OST_FOUNDATION_ADDRESS
      ,REGISTRAR = coreConstants.OST_REGISTRAR_ADDRESS
      ,SIMPLETOKEN_CONTRACT = coreConstants.OST_SIMPLETOKEN_CONTRACT_ADDRESS
      ,STAKE_CONTRACT = coreConstants.OST_STAKE_CONTRACT_ADDRESS
;


const _super = Geth.ValueChain.eth.Contract;

Assert.equalsIgnoreCase = function () {
    var _args = Array.prototype.slice.call(arguments);
    _args.forEach( function ( arg, indx ) {
        _args[ indx ] = String( arg ).toLowerCase();
    });
    return Assert.equal.apply(Assert, _args);
};



/** Constructor.
 * @param {options} (optional): The options of the contract. Some are used as fallbacks for calls and transactions.
 */

const SimpleToken = module.exports = function( options ) {
  //Validate Contract Address.
  this.validateContractAddress();

  //Load the contract.
  const SimpleTokenJson = require("../contracts/SimpleToken.json");
  const _interface = JSON.parse(SimpleTokenJson.contracts["SimpleToken.sol:SimpleToken"].abi);
  const _address = this.getContractAddress();

  const args = [_interface,_address];
  if ( options ) {
    args.push( options );
  }

  _super.apply( this, args );
  this.setProvider(Geth.ValueChain.currentProvider);
  this.validateSelf();
};

SimpleToken._contract_address = SIMPLETOKEN_CONTRACT;
SimpleToken.getContractAddress = function () {
  return SimpleToken._contract_address;
};
SimpleToken.setContractAddress = function ( newAddress ) {
  SimpleToken._contract_address = newAddress;
};

SimpleToken.prototype = Object.create( Geth.ValueChain.eth.Contract.prototype );

// reads and returns Contract Address from config.
SimpleToken.prototype.getContractAddress = function () {
  return SimpleToken.getContractAddress();
}

//Validate if Contract Address exists on ValueChain.
SimpleToken.prototype.validateContractAddress = function () {
  const contractAddress = this.getContractAddress();
  // Assert.notEqual( await Geth.ValueChain.eth.getCode(contractAddress, null) , "0x", "Invalid SimpleToken Contract Address");  
};

//Initializes contract. 
SimpleToken.prototype.validateSelf = function () {
  // Assert.strictEqual(await stContract.methods.symbol().call(), "ST");
  // Assert.strictEqual(await stContract.methods.name().call(), "Simple Token");
};

SimpleToken.prototype.validateOwner = function ( ownerAddress ) {
  // Assert.equalsIgnoreCase(await stContract.methods.owner().call(), ownerAddress);
};





module.exports = SimpleToken;