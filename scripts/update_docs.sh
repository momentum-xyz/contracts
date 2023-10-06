#!/bin/sh

# Update docs
npx hardhat docgen

# Check for sol2uml tool. If not present, install it
if ! command -v sol2uml &> /dev/null
then
    npm link sol2uml --only=production
    npm upgrade sol2uml -g
fi

# Update UMLs
sol2uml class ./contracts/token/DADToken.sol -f png -o ./docs/images/dad
sol2uml class ./contracts/token/MomToken.sol -f png -o ./docs/images/mom
sol2uml class ./contracts/nft/OdysseyNFT.sol -f png -o ./docs/images/nft
sol2uml class ./contracts/staking/Staking.sol -f png -o ./docs/images/stake
sol2uml class ./contracts/node/NodeManagement.sol -f png -o ./docs/images/node
sol2uml class ./contracts/vesting/Vesting.sol -f png -o ./docs/images/vesting
sol2uml class ./contracts -f png -o ./docs/images/