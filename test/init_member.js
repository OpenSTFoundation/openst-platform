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

  console.log("sourcefilePath", sourcefilePath);
  console.log("destFilePath", destFilePath);

  const readStream = fs.createReadStream( sourcefilePath )
    , writeStream  = fs.createWriteStream( destFilePath )
  ;
  
  readStream.on("end", () => {
    console.log("readStream end");
  });

  readStream.on("error", () => {
    console.log("readStream ERROR");
    console.log( arguments );
  });

  writeStream.on("end", () => {
    console.log("writeStream end");
  });

  writeStream.on("error", () => {
    console.log("writeStream ERROR");
    console.log( arguments );
  });




  readStream.pipe( writeStream );
  return new Promise( (resolve,reject) =>{
    readStream.on('end', () => {
      return resolve();
    });
  })

}

function main () {
  
  const coreAddresses = require(rootPrefix+'/config/core_addresses');
  const initKlass = require(rootPrefix+'/tools/init_utility_token');
  const fundMember = require( rootPrefix + '/test/fundMember');

  const initKlassObj = new initKlass;
  var btSymbol = 'ACME';
  var btName = 'Acme Coin';
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
      return copyKeyToValueChain( memberAddress );     
    })
    .finally ( _ => {
      process.exit(0);
    })
  ;
}

main();

