# OST Platform changelog

## [v 0.9.1](https://github.com/OpenSTFoundation/openst-platform/releases/tag/v0.9.1) (19 Dec 2017)

### Connecting Geth to Utility Chain
  - Users can donwload and execute shell script to connect to utility chain.
  - #### Main-Net Utility Chain
      ```
      wget https://s3.amazonaws.com/assets.simpletoken.com/scripts/setup_uc_1411_node.sh
      sh setup_uc_1411_node.sh
      ```
      
  - #### Test-Net Utility Chain
      ```
      wget https://s3.amazonaws.com/assets.simpletoken.com/scripts/setup_uc_1410_node.sh
      sh setup_uc_1410_node.sh
      ```
      
### Development Environment
  - Scripts to setup local Value Chain & Utility Chain for development/testing purposes have been provided. Please refer [test/README.md](test/README.md)

### Deployment
  - The Deployment script has been broken into three parts:
    - ##### tools/deploy/openst_and_registrar_value.js
      - Deploys Registrar Contract on value chain. 
      - Deploys OpenST Value Contract on value chain.
    - ##### tools/deploy/openst_stprime_registrar_utility.js
      - Deploys Registrar contract on utility chain.
      - Deploys openSTUtility contract on utility chain.
      - Deploys STPrime contract on utility chain.
    - ##### tools/deploy/core_and_register_utility_token_value.js
      - Deploys ValueCore contract.

### Services
  - #### Intercom Services:
    Intercom services are responsible for transfering information between value chain & utility chain by listening to events.
    The intercom transfers information using registrar contracs. Services:  
    - ##### services/inter_comm/stake_and_mint.js
      - Listens: StakingIntentDeclared event on value chain.
      - Action: confirms staking intent on utility chain.
    - ##### services/inter_comm/redeem_and_unstake.js
      - Listens: RedemptionIntentDeclared event on utility chain.
      - Action: Confirms redemption intent on value chain.
    
### Tools
  - #### Stake And Mint Tools:
    - ##### tools/stake_and_mint/for_st_prime.js
      -  Stakes Simple-Token on the value chain and mints simple-token-prime on the utility chain.
      -  By default, Staker Address is Utility-Chain Owner Address
    - ##### tools/stake_and_mint/for_branded_token.js
      - Stakes simple-token on the value chain and mints branded token on the utility chain.
      
  - #### Redeem And Unstake Tools:
    - ##### tools/unstake_and_redeem/for_st_prime.js
      - Redeems simple-token-prime on the utility chain and unstakes simple-token on the value chain.
    - ##### tools/unstake_and_redeem/for_branded_token.js
      - Redeems branded-token on the utility chain and unstakes simple-token on the value chain.

### API
  - All branded token API have been moved to /bt/[SYMBOL]/
  - Standard format for API.
  ```javascript
  {
    success: true/false
    data: {
      ...
    },
    error: {
      ...
    }
  }
  ```

  - #### Available API
    - ##### /bt/[SYMBOL]/
      - Serves as health check for the branded token API(s).
    - ##### /bt/[SYMBOL]/reserve
      - Returns the reserve address associated with branded token.
    - ##### /bt/[SYMBOL]/name
      - Returns the branded token name.
    - ##### /bt/[SYMBOL]/uuid
      - Returns the UUID of the branded token.
    - ##### /bt/[SYMBOL]/symbol
      - Returns the symbol of the branded token.
    - ##### /bt/[SYMBOL]/decimals
      - Returns the decimals configured in the branded token.
    - ##### /bt/[SYMBOL]/totalSupply 
      - Returns the total supply of branded token.
    - ##### /bt/[SYMBOL]/balanceOf?owner=[OWNER] 
      - Returns the amount of branded token owned by the address [OWNER]
    - ##### /bt/[SYMBOL]/newkey 
      - Creates a new managed user key and returns the address.
    - ##### /bt/[SYMBOL]/transfer?sender=[SENDER]&to=[RECIPIENT]&amount=[AMOUNT]&tag=[TRANSFER_TAG]. 
      - Transfers specified [AMOUNT] branded tokens from SENDER address to RECIPIENT address.
      - Also returns TRANSACTION_UUID generated for the transaction. This TRANSACTION_UUID can be used fetch transaction logs.
      - Notes: 
        - RESERVE address must be SimpleToken Managed address created using tools/init_utility_token script.
        - SENDER address must be SimpleToken Managed address created using /bt/[SYMBOL]/newkey Api.
        - The RESERVE address also transfers ST Prime to the sender address if sender address does not have sufficient ST Prime to carry out the transfer.
    - ##### /bt/[SYMBOL]/failed-transactions
      - Returns an array of failed TRANSACTION_UUID(s).
    - ##### /bt/[SYMBOL]/pending-transactions
      - Returns an array of TRANSACTION_UUID(s) that are currently in progress.
    - ##### /bt/[SYMBOL]/transaction-logs?transactionUUID=[TRANSACTION_UUID]
      - Returns the transaction logs associated with TRANSACTION_UUID.
      
