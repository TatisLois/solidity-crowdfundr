const hre = require("hardhat");

async function main() {
  const Crowdfunder = await hre.ethers.getContractFactory("Crowdfunder");
  const crowdfunder = await Crowdfunder.deploy();

  await crowdfunder.deployed();

  console.log(
    "Crowdfunder Deployed On The Local Network At Address:",
    crowdfunder.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
