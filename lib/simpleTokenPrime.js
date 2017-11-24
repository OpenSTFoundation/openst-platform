const reqPrefix = ".."
      ,Geth   = require( reqPrefix + "/lib/geth")
      ,Config = require(reqPrefix + "/config.json")
;

/** Enforce the argument is a valid Ethereum address. Throws if it's not.
 * @param {string} address The string to check.
 */
function enforceAddress(address) {
  Assert.ok(/^0x[0-9a-fA-F]{40}$/.test(address), `Invalid blockchain address: ${address}`);
}

const STP = module.exports = {
  balanceOf: function () {
    Assert.strictEqual(typeof owner, 'string', `owner must be of type 'string'`);

    return Geth.UtilityChain.eth.getBalance( owner )
      .then(balance => {
        Assert.ok(balance >= 0);
        return new BigNumber(balance);
      });
  }
  ,transfer : function(sender, to, value) { 
    Assert.strictEqual(typeof sender, 'string', `sender must be of type 'string'`);
    Assert.strictEqual(typeof to, 'string', `to must be of type 'string'`);
    Assert.strictEqual(value instanceof BigNumber, true, `value must be of type 'BigNumber'`);
    //Address.
    enforceAddress(sender);
    enforceAddress( to );

    //Validation: Sender must a member company.
    return Geth.UtilityChain.eth.personal.unlockAccount(sender)
      .then(_ => {
        return Geth.UtilityChain.eth.sendTransaction({
          from: sender,
          to: to,
          value: value
        });
      });
    ;
  }
  ,isMember : function ( ownerAddress ) {
    ownerAddress = String( ownerAddress );
    ownerAddress = ownerAddress.toLowerCase();

    
    const members = Config.Members;
    
    //Use Array.some 
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some
    return members.some( member => {
      var memberAddress = member.Reserve;
      memberAddress = String( memberAddress );
      memberAddress = memberAddress.toLowerCase();
      if ( ownerAddress === memberAddress ) {
        return true;
      }
      return false;
    });
  }

};