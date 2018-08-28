# Developer guide
This document describes the usage of OpenSTPlatform and its services. All the services are briefly described and their one usage is demonstrated.

##### Creating OpenSTPlatform object
OpenST-Platform needs various configurations for its object creation. For getting list of all the supported configurations,
please see [OpenST-Platform-APIs](https://github.com/OpenSTFoundation/openst-platform-apis/blob/feature/config_strategy/config/strategies.json).

Following snippet assumes that the config.json is kept at a certain location has the configuration details.
This config can come from a database, from a file or from any other source.

```sh
npm install @openstfoundation/openst-platform
```

### OpenST-Platform Usage 

```js
const OpenStPlatform = require('@openstfoundation/openst-platform');
const os = require('os');
const configStrategies = require(os.homedir() + '/openst-setup/openst_platform_config.json');
const openSTPlatform = new OpenStPlatform(configStrategies);
```

### OpenST-Platform Services
We will now go one by one into each of the services. Specifically, we will look into what the service does and one example code usage.


#### Approve related services

#### Get Allowance service

```js
let Service = openSTPlatform.services.approve.getAllowance;
let sObj = new Service({
  erc20_address: '0xb65FFE52F9a9AACc5Cb6f210A874D0A77c4223B1',
  owner_address: '0x148c7437DA4361F963096480F8B543279A1F82A4',
  spender_address: '0x7E0271D9DE2e6649cb589071F5efd1c9f021F6DC'
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

#### Transfer related services

##### Transfer BT service
This service is used for transferring branded tokens on utility chain from sender address to recipient address.
It takes the amount to be transferred in Wei unit (i.e. 10^-18 branded token). The ERC20 contract address of the branded token 
is also needed as a parameter to the service.

```js
let Service = openSTPlatform.services.transaction.transfer.brandedToken;
let sObj = new Service({
  erc20_address: '0x67b6Fd134e6d8fa32c801A85453726FA26B9aBdB',
  sender_address: '0x8eC6FdCa06ff0FD945cDAC0F80122a01bd564da7',
  sender_passphrase: 'acmeOnopenST',
  recipient_address: '0x38e1983a9b5bef2f0dc03e87c5d806e775437fb8',
  amount_in_wei: '1000000000000000000',
  options: {tag: 'upvote'}
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### Transfer ETH service
This service is used for transferring ETH on value chain from sender address to recipient address.
It takes the amount to be transferred in Wei unit (i.e. 10^-18 ETH).

```js
let Service = openSTPlatform.services.transaction.transfer.eth;
let sObj = new Service({
  sender_address: '0x8eC6FdCa06ff0FD945cDAC0F80122a01bd564da7',
  sender_passphrase: 'acmeOnopenST',
  recipient_address: '0x38e1983a9b5bef2f0dc03e87c5d806e775437fb8',
  amount_in_wei: '1000000000000000000',
  options: {tag: 'options'}
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### Transfer OST service
This service is used for transferring OST on value chain from sender address to recipient address.
It takes the amount to be transferred in Wei unit (i.e. 10^-18 OST).

```js
let Service = openSTPlatform.services.transaction.transfer.simpleToken;
let sObj = new Service({
  sender_address: '0x8eC6FdCa06ff0FD945cDAC0F80122a01bd564da7',
  sender_passphrase: 'acmeOnopenST',
  recipient_address: '0x38e1983a9b5bef2f0dc03e87c5d806e775437fb8',
  amount_in_wei: '1000000000000000000',
  options: {tag: 'options'}
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### Transfer OST Prime service
This service is used for transferring OST Prime (which is used as gas) on utility chain from sender address to recipient address.
It takes the amount to be transferred in Wei unit (i.e. 10^-18 OST prime).

```js
let Service = openSTPlatform.services.transaction.transfer.simpleTokenPrime;
let sObj = new Service({
  sender_address: '0x8eC6FdCa06ff0FD945cDAC0F80122a01bd564da7',
  sender_passphrase: 'acmeOnopenST',
  recipient_address: '0x38e1983a9b5bef2f0dc03e87c5d806e775437fb8',
  amount_in_wei: '1000000000000000000',
  options: {tag: 'options'}
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

#### Transaction helper services

##### Estimate Gas service
This service is used for estimating gas which will be used in the execution of a particular method of a openST contract.
Contract name can be one of - simpleToken, openSTUtility, openSTValue, stPrime, valueCore, valueRegistrar, utilityRegistrar,
brandedToken, simpleStake, airdrop. Method name can be any valid method name which is defined in the given contract.
Method arguments are passed as an array.

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
This service is used to fetch the transaction receipt using the transaction hash. It takes in the name of the chain which it needs to go for fetching the transaction hash.

```js
let Service = openSTPlatform.services.transaction.getReceipt;
let sObj = new Service({
  chain: 'value',
  transaction_hash: '0x48c39a6ee3bc065b95d123b7c825a34b8f1cdb6cb9fb8bd6935ac15a6dc71574',
  address_to_name_map: {'0x67b6fd134e6d8fa32c801a85453726fa26b9abdb': 'brandedToken'}
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### BT approve service

```js
let Service = openSTPlatform.services.transaction.getReceipt;
let sObj = new Service({
  erc20_address: '0x67b6Fd134e6d8fa32c801A85453726FA26B9aBdB',
  approver_address: '0x8eC6FdCa06ff0FD945cDAC0F80122a01bd564da7',
  approver_passphrase: 'acmeOnopenST',
  approvee_address: '0xDBBC2C585CE468c3118Fa94e15c8c546b0bA4355',
  to_approve_amount: '1000000000000000000'
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

#### Balance services

##### Get Branded Token Balance Service
This service is used to get balance of Branded token for a particular address. The ERC20 contract address of the branded token 
is needed as a parameter to the service. The balance which is fetched includes the effect of pessimistic caching.

```js
let Service = openSTPlatform.services.balance.brandedToken;
let sObj = new Service({
  erc20_address: '0x67b6Fd134e6d8fa32c801A85453726FA26B9aBdB',
  address: '0x8eC6FdCa06ff0FD945cDAC0F80122a01bd564da7'
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### Get Branded Token Balance from Chain Service
This service is used to get balance of Branded token for a particular address. The ERC20 contract address of the branded token 
is needed as a parameter to the service. The balance which is fetched does not include the effect of pessimistic caching.

```js
let Service = openSTPlatform.services.balance.brandedTokenFromChain;
let sObj = new Service({
  erc20_address: '0x67b6Fd134e6d8fa32c801A85453726FA26B9aBdB',
  address: '0x8eC6FdCa06ff0FD945cDAC0F80122a01bd564da7'
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### Get Eth Balance Service
This service is used to get balance of ETH for a particular address.

```js
let Service = openSTPlatform.services.balance.eth;
let sObj = new Service({
  address: '0x8eC6FdCa06ff0FD945cDAC0F80122a01bd564da7'
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### Get OST Balance Service
This service is used to get balance of OST for a particular address.

```js
let Service = openSTPlatform.services.balance.simpleToken;
let sObj = new Service({
  address: '0x8eC6FdCa06ff0FD945cDAC0F80122a01bd564da7'
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### Get OST Prime Balance Service
This service is used to get balance of OST Prime for a particular address.

```js
let Service = openSTPlatform.services.balance.simpleTokenPrime;
let sObj = new Service({
  address: '0x8eC6FdCa06ff0FD945cDAC0F80122a01bd564da7'
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

#### Stake and mint services

##### Approve for Stake Service
The Staker address needs to approve OpenST Value contract before calling stake. This service helps achieve this.

```js
let Service = openSTPlatform.services.stake.approveForStake;
let sObj = new Service({});

sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### Get Approval Status (need transaction_hash of approveForStake)
This service helps in getting status of the approval transaction done from the above service.

```js
let Service = openSTPlatform.services.stake.getApprovalStatus;
let sObj = new Service({
  transaction_hash : '0x4f43a920d2c6ea23a1c2b99a57352f26acb43c463d1862fa27ece3972d6ed4f6'
});

sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### Start Stake
This service is used for starting the stake process. It takes in the beneficiary address, to stake amount in weis and uuid of the branded token the stake is meant for in the parameters.

```js
let Service = openSTPlatform.services.stake.start;
let sObj = new Service({
  beneficiary: '0xF0Bd98D421b058C34F60c4613D441A03FF363283', 
  to_stake_amount: '10000000000000000000', 
  uuid: '0x6fa1d34e78a0fcdbdd0432827f8ebdcf3ef274ed6e49d63baebecad4492011e7'
});

sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### Get Staked Amount
This service fetches the total staked amount of OST which a staker address has staked.

```js
let Service = openSTPlatform.services.stake.getStakedAmount;
let sObj = new Service({
  simple_stake_contract_address: '0x2Ce60C3C481a58caf91Aab53b979E8342726976A'
});

sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

#### On Boarding services
On boarding here means the process of getting branded token proposed and registered on both the chains.

##### Propose branded token service 
This service does the propose of the branded token using the name, symbol and conversion factor as its arguments.

```js
let Service = openSTPlatform.services.onBoarding.proposeBrandedToken;
let sObj = new Service({
  name:'ABCD', 
  symbol: 'ABCD', 
  conversion_factor: '1'});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### Get registration status service 
To bring a branded token into existence, various steps are involved. To get status of all these steps, this service can be used.
It takes in the transaction_hash of the propose transaction.

```js
let Service = openSTPlatform.services.onBoarding.getRegistrationStatus;
let sObj = new Service({
  transaction_hash: '0xb0f72a92fd2252d766f5ff26e6ecc7bec576fcdf030c278ec55d75874381cbc4'
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

#### Intercomm services

##### Register Branded Token
This services exposes the register branded token inter chain communicator as a service, so that any one can run this on their own.

```js
let Service = openSTPlatform.services.interComm.registerBrandedToken;
let sObj = new Service({
  file_path: '$HOME/openst-setup/logs/register_branded_token.data'
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### Stake and Mint
This services exposes the stane and mint inter chain communicator as a service, so that any one can run this on their own.
```js
let Service = openSTPlatform.services.interComm.stakeAndMint;
let sObj = new Service({
  file_path: '$HOME/openst-setup/logs/register_branded_token.data'
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### Stake and Mint Processor
This services exposes the stake and mint processor inter chain communicator as a service, so that any one can run this on their own.

```js
let Service = openSTPlatform.services.interComm.stakeAndMintProcessor;
let sObj = new Service({
  file_path: '$HOME/openst-setup/logs/register_branded_token.data'
});
sObj.perform().then(function(r){console.log(JSON.stringify(r))});
```

