# Momentum Smart Contracts
Smart Contracts for Momentum.
## Initialize
Make sure to have `node` >= 18 and `npm` >= 9, then
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

## Generate UML Diagrams
Install `sol2uml`
```sh
npm link sol2uml --only=production
```

then, run from git root folder:
```sh
sol2uml class ./contracts -f all -o ./docs/
```

If you want to generate a specific contract UML class diagram, just run:
```sh
sol2uml class <PATH_TO_FILE> -f all -o <OUTPUT_FILE_PATH>
```

For more info on `sol2uml`, you can check their [repo](https://github.com/naddison36/sol2uml).