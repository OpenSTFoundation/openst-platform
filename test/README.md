# Demo Instructions

## Prerequisite installations 

* Install node version >= 8.7.0
* Install geth version >= 1.7.2

## Setup utility and value chains 

### Terminal 1:

* Go to OpenST Platform repo directory
  > cd openst-platform 

* Install Packages
  > npm install

* Delete old chains, if exist
  > rm -r test/st-poa-*

* Initialize utility and value chains and required keys
  > cd test
  
  > ./init_keys.sh
  
### In Terminal 2:

* Start Value Chain
  > cd openst-platform/test
  
  > ./run_value_chain.sh
  
### In Terminal 3:

* Start Utility Chain
  > cd openst-platform/test
  
  > ./run_utility_chain.sh
  
### Bank in Terminal 1:
* Run the complete test suite
  > cd ..
  
  > source test/open_st_env_vars.sh
  
  > ./run_complete_test_deploy.sh
  
## Stake OST on value chain and Mint Branded Tokens on utility chain

### In Terminal 1:
* Start the stake and mint intercom process while branded tokens are minting (NOTE: This process need to be running till Terminal 2 process ends)
  > cd openst-platform
  
  > source test/open_st_env_vars.sh
  
  > node services/inter_comm/stake_and_mint.js

### In Terminal 2:
* Start minting branded token by staking OST
  > cd openst-platform
  
  > source test/open_st_env_vars.sh
  
  > node tools/stake_and_mint/for_branded_token.js
  
## Time to start playing with OpenST Restful APIs!

* Start the restful API server
  > cd openst-platform
  
  > npm start
  
#### To use Postman for Restful APIs (optional)  

* Import OpenST route collection from openst-platform/test/postman/OpenST_routes.json

* Import OpenST environment from openst-platform/test/postman/OpenST_env.json and modify the environment variables by referring openst-platform/config.json


## Redeem branded token on utility chain to unstake OST on value chain 

### In Terminal 1:
* Start the redeem and unstake intercom process (NOTE: This process need to be running till Terminal 2 process ends)
  > cd openst-platform
  
  > source test/open_st_env_vars.sh
  
  > node services/inter_comm/redeem_and_unstake.js 

### In Terminal 2:
* Start the redeem and unstake process
  > cd openst-platform
  
  > source test/open_st_env_vars.sh
  
  > node tools/unstake_and_redeem/for_branded_token.js