# Milestone 1 - demo instructions

## install

run (node version 8.7.0)

    npm install

## setup

    cd test
    ./init_keys.sh
    ./init_chain.sh

open two separate terminals and run:

    ./run_value_chain.sh
    and ./run_utility_chain.sh

in the original terminal:

	cd ../tools
	node deployContracts.js

open two more terminals and run:

    cd ../tools/EventListners
    node ValueChainEventListener.js
    and node UtilityTokenEventListner.js

## run the demo to stake for ACME corp

    cd test
    node test_staking.js

## run the API

on the machine where the utility chain runs

    npm start
