https://github.com/TatisLois/solidity-crowdfundr

The following is a micro audit of git commit 492de429622176c2cfc5d95b8dacd953abb2b549

~~Cancel feature seems to be missing.~~ (Under function archiveAProject)

## issue-1

**[High]** Don't use .transfer()

https://consensys.github.io/smart-contract-best-practices/recommendations/#dont-use-transfer-or-send

## issue-2

**[Low]** Use of iteration over arrays

croundfunder.sol:49 and croundfunder.sol:66 iterate over an arbitrarily long array. This could become a problem for accounts that own a high number of projects, or accounts that contribute to a high number of projects.

See https://consensys.github.io/smart-contract-best-practices/known_attacks/#gas-limit-dos-on-a-contract-via-unbounded-operations

Consider using a nested mapping instead of an array. This will also greatly simplify the rest of the codebase.

## Nitpicks

- Solidity file names should conventionally match the casing of its contract
- Consider renaming `ownersProjectsIds` to `projectIdsByOwner`
- "it's" should be "its" in "Project has met it's funding goal"
- "fund raising" should be "fundraising"
