# Milestone 1 - demo instructions

## Pre requisite installations 

* Install node version 8.7.0
* Install geth version 1.7.0-stable-6c6c7b2a

## Setup utility and value chains and Stake/Mint the Branded Tokens

* Go to repo directory
  > cd openst-platform 

* Install Packages
  > npm install

* Delete old chains
  > rm -r test/st-poa-*

* Initialize keys
  > cd test
  > ./init_keys.sh
  
* Start Value Chain in a new Terminal
  > cd openst-platform
  > cd test
  > ./run_value_chain.sh
  
* Start Utility Chain in a new Terminal
  > cd openst-platform
  > cd test
  > ./run_utility_chain.sh
  
* Run complete test deploy
  > cd openst-platform
  > source test/open_st_env_vars.sh
  > ./run_complete_test_deploy.sh
  
  
  
## Start Restful API

on the machine where the utility chain runs

    npm start
