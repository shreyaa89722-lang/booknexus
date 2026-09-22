const hre = require("hardhat");

async function main() {
  const BookRental = await hre.ethers.getContractFactory("BookRental");
  const contract = await BookRental.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("BookRental deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
