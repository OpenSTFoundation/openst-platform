# Milestone 1 - demo instructions

## Pre requisite installations 

* Install node version >= 8.7.0
* Install geth version >= 1.7.0-stable-6c6c7b2a

## Setup utility and value chains. Get the Branded Tokens in utility chain 

* Go to OpenST Platform repo directory
  > cd openst-platform 

* Install Packages
  > npm install

* Delete old chains, if exist
  > rm -r test/st-poa-*

* Initialize keys
  > cd test
  
  > ./init_keys.sh
  
* Start Value Chain in a new Terminal
  > cd openst-platform/test
  
  > ./run_value_chain.sh
  
* Start Utility Chain in a new Terminal
  > cd openst-platform/test
  
  > ./run_utility_chain.sh
  
* Run complete test deploy
  > cd openst-platform
  
  > source test/open_st_env_vars.sh
  
  > ./run_complete_test_deploy.sh
  
## Restful API

* Start the restful API server
  > cd openst-platform
  
  > npm start