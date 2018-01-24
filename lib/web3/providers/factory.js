"use strict";


const web3Factory = {

  typeRPC: "rpc",
  typeWS: "ws",
  utilityChain: "utility",
  valueChain: "value",

  getProvider: function(chain, type){
    const oThis = this;
    if(oThis.valueChain === chain){
      if(oThis.typeRPC === type){
        return require('./value_rpc');
      } else if(oThis.typeWS === type){
        return require('./value_ws');
      }
    } else if(oThis.utilityChain === chain){
      if(oThis.typeRPC === type){
        return require('./utility_rpc');
      } else if(oThis.typeWS === type){
        return require('./utility_ws');
      }
    }
    return null;
  }

};

module.exports = web3Factory;