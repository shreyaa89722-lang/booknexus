const { ethers } = require("ethers");
const contractABI = require("../blockchain/BookRentalABI.json");

function getBlockchainInstance() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.BACKEND_WALLET_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress || contractAddress.includes("YOUR_") || contractAddress.includes("0xABC123")) {
    return null;
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    return { provider, wallet, contract };
  } catch (error) {
    console.error("Failed to initialize blockchain service:", error.message);
    return null;
  }
}

async function recordRentalOnChain(bookId, renterAddress, dueDateUnix) {
  const instance = getBlockchainInstance();
  if (!instance) {
    console.warn("Blockchain recording skipped: Sepolia RPC URL, Contract Address, or Private Key not configured.");
    return null;
  }

  // Use wallet address if renterAddress is invalid/placeholder
  const targetRenter = (renterAddress && ethers.isAddress(renterAddress)) 
    ? renterAddress 
    : instance.wallet.address;

  const tx = await instance.contract.createRental(bookId, targetRenter, dueDateUnix);
  const receipt = await tx.wait();

  let onChainRentalId = null;
  if (receipt && receipt.logs) {
    for (const log of receipt.logs) {
      try {
        const parsed = instance.contract.interface.parseLog(log);
        if (parsed && parsed.name === "RentalCreated") {
          onChainRentalId = Number(parsed.args.rentalId || parsed.args[0]);
          break;
        }
      } catch {
        // Log is from another contract or event format
      }
    }
  }

  return { txHash: receipt.hash, onChainRentalId };
}

async function recordReturnOnChain(onChainRentalId) {
  const instance = getBlockchainInstance();
  if (!instance) {
    console.warn("Blockchain return recording skipped: Sepolia RPC URL, Contract Address, or Private Key not configured.");
    return null;
  }

  if (onChainRentalId === null || onChainRentalId === undefined || isNaN(Number(onChainRentalId))) {
    console.warn("Blockchain return skipped: invalid or missing onChainRentalId:", onChainRentalId);
    return null;
  }

  const tx = await instance.contract.markReturned(BigInt(onChainRentalId));
  const receipt = await tx.wait();
  return receipt.hash;
}

module.exports = { recordRentalOnChain, recordReturnOnChain };
