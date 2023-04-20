# Momentum Smart Contracts
Smart Contracts for Momentum.
## Initialize
Make sure to have `node` >= 16 and `npm` >= 8, then
```sh
npm i
```
## Compile
```sh
npx hardhat compile
```
## Test
```sh
npx hardhat test
```
### Generate coverage results and Istanbul 
```sh
npx hardhat coverage
```

### Test with gas usage report
```sh
REPORT_GAS=true npx hardhat test
```

## Deploy
```sh
npx hardhat deploy
```