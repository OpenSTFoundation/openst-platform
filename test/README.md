# Demo Instructions

## Prerequisite installations 

* Install node version >= 8.7.0
* Install geth version >= 1.7.2

## Setup utility and value chains 

### In Terminal 1:

* Go to OpenST Platform repo directory
```
  > cd openst-platform 
```

* Install Packages
```
  > npm install
```

* Delete old chains, if exist
```
  > rm -r test/st-poa-*
```

* Initialize utility and value chains and required keys
```
  > cd test
  > ./init_keys.sh
```
  
### In Terminal 2:

* Start Value Chain
```
  > cd openst-platform
  > cd test
  > ./run_value_chain.sh
```
  
### In Terminal 3:

* Start Utility Chain
```
  > cd openst-platform
  > cd test
  > ./run_utility_chain.sh
```
  
### Bank in Terminal 1:
* Run the complete test suite
```
  > cd ..
  > source test/open_st_env_vars.sh
  > ./run_complete_test_deploy.sh
```
  
## Stake Simple Tokens on value chain to mint Branded Tokens

### In Terminal 1:
* Start the stake and mint intercom process while branded tokens are minting (NOTE: This process need to be running till Terminal 2 process ends)
```
  > cd openst-platform
  > source test/open_st_env_vars.sh
  > node services/inter_comm/stake_and_mint.js
```

### In Terminal 4:
* Start minting branded token by staking OST
```
  > cd openst-platform
  > source test/open_st_env_vars.sh
  > node tools/stake_and_mint/for_branded_token.js
  Note: ACME key password is "testtest"
```
  
## Time to start playing with OpenST Restful APIs!

* Start the restful API server
```
  > cd openst-platform
  > npm start
```
  
##### To use Postman for Restful APIs (optional)  

* Import OpenST routes from ``openst-platform/test/postman/OpenST_routes.json``

* Import environment variables from ``openst-platform/test/postman/OpenST_env.json``
 
* Modify the imported environment variables by referring 'Members' key in ``openst-platform/config.json`` file
  * ``route``: Restful API base route (i.e. http://localhost:3000/bt/acme)
  * ``reserve``: Member company reserve address
  * ``api_user`` and ``api_password``: Basic auth username and password to access APIs

* Let's check if environment is up and branded token is available on utility chain
  * ``API Server HealthCheck``
  * ``Get Branded Token Name`` 
  * ``Get Branded Token UUID``
  * ``Get Branded Token Symbol``
  * ``Get Branded Token Decimal Precision``
  * ``Get Branded Token Total Supply``
  * ``Get Reserve Address``
  * ``Current Balance of Reserve``
  
* Generate user keys and perform transactions
  * ``Generate Key for New User`` - Generate 2 user addresses and update the Postman OpenST environment variables (i.e. user1 and user2)
  * ``Transfer 3 tokens from reserve to user1``
  * ``Current Balance of User1``
  * ``Transfer 2 tokens from User1 to User2``
  * ``Current Balance of User2``
  * ``Transfer 2 tokens from Reserve to User2``
  * ``Transfer 1 token from User2 to Reserve``
  
* You can also get transaction details using following APIs
  * ``Get Pending Transactions``
  * ``Get Failed Transactions``
  * ``Get Transaction Logs`` - transactionUUID is required for this request 


## Redeem branded tokens to unstake Simple Tokens on value chain 

### In Terminal 1:
* Start the redeem and unstake intercom process (NOTE: This process need to be running till Terminal 2 process ends)
```
  > cd openst-platform
  > source test/open_st_env_vars.sh
  > node services/inter_comm/redeem_and_unstake.js
``` 

### In Terminal 2:
* Start the redeem and unstake process
```
  > cd openst-platform
  > source test/open_st_env_vars.sh
  > node tools/unstake_and_redeem/for_branded_token.js
```
