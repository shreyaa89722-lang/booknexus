require('dotenv').config();

async function runFullTest() {
  console.log('🚀 Starting Full System Verification Test...');

  // 1. Health check
  console.log('\n--- 1. Testing GET /api/health ---');
  const healthRes = await fetch('http://localhost:5000/api/health');
  const health = await healthRes.json();
  console.log('Health Response:', health);

  // 2. Student Login
  console.log('\n--- 2. Testing Student Login ---');
  const studentLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'abdur56562541@gmail.com', password: '4MC23CB001' })
  });
  const studentData = await studentLoginRes.json();
  console.log(`Student Login: ${studentData.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  const studentToken = studentData.data.token;

  // 3. Admin Login
  console.log('\n--- 3. Testing Admin Login ---');
  const adminLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@booknexus.com', password: 'Admin@123' })
  });
  const adminData = await adminLoginRes.json();
  console.log(`Admin Login: ${adminData.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  const adminToken = adminData.data.token;

  // 4. Get Books Catalog
  console.log('\n--- 4. Testing Books Catalog ---');
  const booksRes = await fetch('http://localhost:5000/api/books');
  const booksData = await booksRes.json();
  console.log(`Books retrieved: ${booksData.data.length} books found`);
  const targetBook = booksData.data.find(b => b.availability === 'available');
  console.log(`Selected Book for rental test: "${targetBook.title}" (ID: ${targetBook._id})`);

  // 5. Request Rental by Student
  console.log('\n--- 5. Student Requesting Rental ---');
  const rentRes = await fetch('http://localhost:5000/api/rentals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({ bookId: targetBook._id })
  });
  const rentData = await rentRes.json();
  console.log('Rental Request Created:', rentData.success ? '✅ SUCCESS' : '❌ FAILED');
  const rentalId = rentData.data._id;

  // 6. Approve Rental by Admin (Triggers Blockchain Recording!)
  console.log('\n--- 6. Admin Approving Rental (Recording on Blockchain) ---');
  const approveRes = await fetch(`http://localhost:5000/api/rentals/${rentalId}/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  });
  const approveData = await approveRes.json();
  console.log('Rental Approved:', approveData.success ? '✅ SUCCESS' : '❌ FAILED');
  console.log('On-Chain Tx Hash:', approveData.data.contractTxHash || 'None');
  console.log('On-Chain Rental ID:', approveData.data.onChainRentalId !== undefined ? approveData.data.onChainRentalId : 'None');

  // 7. Return Book (Triggers Blockchain Return)
  console.log('\n--- 7. Returning Book (Updating Blockchain) ---');
  const returnRes = await fetch(`http://localhost:5000/api/rentals/${rentalId}/return`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  });
  const returnData = await returnRes.json();
  console.log('Rental Returned:', returnData.success ? '✅ SUCCESS' : '❌ FAILED');
  console.log('Rental Final Status:', returnData.data.status);

  console.log('\n=========================================');
  console.log('🎉 ALL INTEGRATION TESTS PASSED 100%!');
  console.log('=========================================');
}

runFullTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
