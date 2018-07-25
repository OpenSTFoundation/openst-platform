# Usage guide
This document describes the usage of OpenSTPlatform and its services. All the services are briefly described and their one usage is demonstrated.

##### Creating OpenSTPlatform object
OpenST-Platform needs various configurations for its object creation. For getting list of all the supported configurations,
please see [OpenST-Platform-APIs](https://github.com/OpenSTFoundation/openst-platform-apis/blob/master/config/strategies.json).

Following snippet assumes that the config.json kept at a certain location has the configuration details.
```bash
const OpenStPlatform = require('@openstfoundation/openst-platform');

const rootPrefix = '.',
  configStrategies = require('$HOME/openst-setup/openst_platform_config.json');

const openSTPlatform = new OpenStPlatform(configStrategies);
```

### OpenST-Platform Services

#### Transfer related services
##### Transfer BT service
```js
let Service = openSTPlatform.services.transaction.transfer.brandedToken;
let sObj = new Service({
	  erc20_address: '0x67b6Fd134e6d8fa32c801A85453726FA26B9aBdB',
	  sender_address: '0x8eC6FdCa06ff0FD945cDAC0F80122a01bd564da7',
	  sender_passphrase: 'acmeOnopenST',
	  recipient_address: '0x38e1983a9b5bef2f0dc03e87c5d806e775437fb8',
	  amount_in_wei: '1000000000000000000',
	  options: {
		  tag: 'upvote'
	  }
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### Transfer ETH service
```js
let Service = openSTPlatform.services.transaction.transfer.eth;
let sObj = new Service({
  sender_address: '0x8eC6FdCa06ff0FD945cDAC0F80122a01bd564da7',
  sender_passphrase: 'acmeOnopenST',
  recipient_address: '0x38e1983a9b5bef2f0dc03e87c5d806e775437fb8',
  amount_in_wei: '1000000000000000000'
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### Transfer OST service
```js
let Service = openSTPlatform.services.transaction.transfer.simpleToken;
let sObj = new Service({
  sender_address: '0x8eC6FdCa06ff0FD945cDAC0F80122a01bd564da7',
  sender_passphrase: 'acmeOnopenST',
  recipient_address: '0x38e1983a9b5bef2f0dc03e87c5d806e775437fb8',
  amount_in_wei: '1000000000000000000'
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### Transfer OST Prime service
```js
let Service = openSTPlatform.services.transaction.transfer.simpleTokenPrime;
let sObj = new Service({
  sender_address: '0x8eC6FdCa06ff0FD945cDAC0F80122a01bd564da7',
  sender_passphrase: 'acmeOnopenST',
  recipient_address: '0x38e1983a9b5bef2f0dc03e87c5d806e775437fb8',
  amount_in_wei: '1000000000000000000'
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```
#### Transaction helper services
##### Estimate Gas service
```js
let Service = openSTPlatform.services.transaction.estimateGas;
let sObj = new Service({
  contract_name: 'openSTUtility',
  contract_address: '0xeb50363846d0Fa097895FDf0B5020ACF852b41bA',
  chain: 'utility',
  sender_address: '0xDBBC2C585CE468c3118Fa94e15c8c546b0bA4355',
  method_name: 'processMinting',
  method_arguments: ['0x0299e439462da8c61ed757e434e00f9136a052d44a5a2af137a3a7c8983f5407']});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### Get Receipt service
```js
let Service = openSTPlatform.services.transaction.getReceipt;
let sObj = new Service({
  chain: 'value',
  transaction_hash: '0x48c39a6ee3bc065b95d123b7c825a34b8f1cdb6cb9fb8bd6935ac15a6dc71574',
  address_to_name_map: {'0x67b6fd134e6d8fa32c801a85453726fa26b9abdb': 'brandedToken'}
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

