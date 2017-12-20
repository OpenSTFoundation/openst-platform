# OST Platform changelog

## [v 0.9.1](https://github.com/OpenSTFoundation/openst-platform/releases/tag/v0.9.1) (19 Dec 2017)

- API
  - Standard format for API.
  ```javascript
  {
    success: true/false
    data: {
      ...
      ...
      ...
    },
    error: {
      ...
      ...
      ...
    }
  }
  ```
  - All branded token API have been moved to /bt/[SYMBOL]/
  - ### Available API
    - /bt/[SYMBOL]/
      - Serves as health check for the branded token API(s).
    - /bt/[SYMBOL]/reserve
      - Returns the reserve address associated with branded token.
    - /bt/[SYMBOL]/name
      - Returns the branded token name.
    - /bt/[SYMBOL]/uuid
      - Returns the UUID of the branded token.
    - /bt/[SYMBOL]/symbol
      - Returns the symbol of the branded token.
    - /bt/[SYMBOL]/decimals
      - Returns the decimals configured in the branded token.
    - /bt/[SYMBOL]/totalSupply 
      - Returns the total supply of branded token.
    - /bt/[SYMBOL]/balanceOf?owner=[OWNER] 
      - Returns the amount of branded token owned by the address [OWNER]
    - /bt/[SYMBOL]/newkey 
      - Creates a new managed user key and returns the address.
    - /bt/[SYMBOL]/transfer?sender=[SENDER]&to=[RECIPIENT]&amount=[AMOUNT]&tag=[TRANSFER_TAG]. Transfers specified [AMOUNT] branded tokens from SENDER address to RECIPIENT address. 
      - Notes: 
        - RESERVE address must be SimpleToken Managed address.
        - SENDER address must be SimpleToken Managed address created using /bt/[SYMBOL]/newkey Api.
        - The RESERVE address also transfers ST Prime to the sender address if sender address does not have sufficient ST Prime to carry out the transfer.





## [v 0.9.0](https://github.com/OpenSTFoundation/openst-platform/releases/tag/v0.9.0) (8 Nov 2017)
