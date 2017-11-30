const rootPrefix = '..';
const path = require('path');
const fs=require('fs');

function copyKeyToValueChain( memberAddress ) {
  var keyFileEnding = memberAddress.replace("0x", "--");
  keyFileEnding = keyFileEnding.toLowerCase();

  console.log( "keyFileEnding", keyFileEnding);
  const sourceDirPath = path.join(__dirname, (rootPrefix + '/test/st-poa-utility/keystore') );
  const destDirPath   = path.join(__dirname, (rootPrefix + '/test/st-poa-value/keystore') );

  var files=fs.readdirSync( sourceDirPath );
  console.log("Scanning Directory");
  var keyFileName = files.find( function ( thisFile ) {
    thisFile = thisFile.toLowerCase();
    return ( thisFile.endsWith( keyFileEnding ) );
  });

  console.log("keyFileName", keyFileName);
  var sourcefilePath = sourceDirPath + "/" + keyFileName
    , destFilePath = destDirPath + "/" + keyFileName
  ;

  fs.createReadStream( sourcefilePath ).pipe( fs.createWriteStream( destFilePath ) );

}

function main () {
  
  const coreAddresses = require(rootPrefix+'/config/core_addresses');
  const initKlass = require(rootPrefix+'/tools/init_utility_token');
  const fundMember = require( rootPrefix + '/test/fundMember');

  const initKlassObj = new initKlass;
  var btSymbol = 'ACME';
  var btName = 'ACMECorpCoin';
  var apiAuthUser = "acme";
  var apiAuthSecret = "acmesecret";
  var btConversion = 10;
  var apiCallbackUrl = "http://localhost:9000"

  var memberAddress = null;
  var memberPassphrase = null;
  var memberConfig = null;


  initKlassObj.newMemberWithConfig(btSymbol, btName, apiAuthUser, apiAuthSecret, apiCallbackUrl)
    .then(newMemberInfo => {
      memberAddress = newMemberInfo.address;
      memberPassphrase = newMemberInfo.passphrase;
      memberConfig = newMemberInfo.config;
      return fundMember( memberConfig )
    })
    .then( _ => {
      return initKlassObj.propose(memberAddress, btSymbol, btName, btConversion);    
    })
    .then( _ => {
      //Copy the key to value chain to enable staking and minting.
      copyKeyToValueChain( memberAddress );     
      process.exit(0);
    })
  ;
}

main();

