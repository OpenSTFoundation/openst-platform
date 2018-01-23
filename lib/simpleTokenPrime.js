const rootPrefix = ".."
  , web3UC = require(rootPrefix + '/lib/web3/providers/utility_rpc');


const STP = module.exports = {

  balanceOf: function () {
    assert.strictEqual(typeof owner, 'string', `owner must be of type 'string'`);

    return web3UC.eth.getBalance(owner)
      .then(balance => {
        assert.ok(balance >= 0);
        return new BigNumber(balance);
      });
  },

  transfer: function (sender, to, value) {
    assert.strictEqual(typeof sender, 'string', `sender must be of type 'string'`);
    assert.strictEqual(typeof to, 'string', `to must be of type 'string'`);
    assert.strictEqual(value instanceof BigNumber, true, `value must be of type 'BigNumber'`);
    //Address.
    enforceAddress(sender);
    enforceAddress(to);

    //Validation: Sender must a member company.
    return web3UC.eth.personal.unlockAccount(sender)
      .then(_ => {
        return Geth.UtilityChain.eth.sendTransaction({
          from: sender,
          to: to,
          value: value
        });
      });
  }

};