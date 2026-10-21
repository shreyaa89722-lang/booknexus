require('dotenv').config();
const { recordRentalOnChain, recordReturnOnChain } = require('./services/blockchainService');

async function test() {
  console.log('Testing blockchain service...');
  console.log('RPC URL:', process.env.SEPOLIA_RPC_URL);
  console.log('Contract Address:', process.env.CONTRACT_ADDRESS);

  const testBookId = 'test-book-12345';
  const testRenter = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const dueDateUnix = Math.floor(Date.now() / 1000) + 14 * 86400;

  console.log('\n1. Creating rental on chain...');
  const result = await recordRentalOnChain(testBookId, testRenter, dueDateUnix);
  console.log('On-chain Rental Result:', result);

  if (result && result.onChainRentalId) {
    console.log('\n2. Marking rental returned on chain...');
    const returnTxHash = await recordReturnOnChain(result.onChainRentalId);
    console.log('Return Tx Hash:', returnTxHash);
    console.log('\n✅ Blockchain integration test PASSED successfully!');
  } else {
    console.error('❌ Failed to get onChainRentalId');
    process.exit(1);
  }
}

test().catch(err => {
  console.error('❌ Blockchain test error:', err);
  process.exit(1);
});
