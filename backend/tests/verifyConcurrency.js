const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function runVerification() {
  console.log('🧪 Starting Concurrency & Inventory Race Condition Verification...');

  try {
    // 1. Login as Admin
    const adminLoginRes = await axios.post(`${API_BASE}/admin/auth/login`, {
      email: 'admin@ecommerce.com',
      password: 'Admin@123456',
    });
    const adminToken = adminLoginRes.data.data.token;
    console.log('✅ Admin login verified.');

    // 2. Create two test customer users
    const user1Email = `user1_${Date.now()}@test.com`;
    const user2Email = `user2_${Date.now()}@test.com`;

    const [u1Res, u2Res] = await Promise.all([
      axios.post(`${API_BASE}/auth/register`, {
        email: user1Email,
        password: 'Password@123',
        fullName: 'Concurrency User 1',
        phone: '9999990001',
      }),
      axios.post(`${API_BASE}/auth/register`, {
        email: user2Email,
        password: 'Password@123',
        fullName: 'Concurrency User 2',
        phone: '9999990002',
      }),
    ]);

    const token1 = u1Res.data.data.token;
    const token2 = u2Res.data.data.token;
    console.log('✅ Created 2 concurrent test users.');

    // 3. Add address for both users
    const [addr1Res, addr2Res] = await Promise.all([
      axios.post(
        `${API_BASE}/addresses`,
        {
          fullName: 'Concurrency User 1',
          phone: '9999990001',
          addressLine1: 'Test Address 1',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
        { headers: { Authorization: `Bearer ${token1}` } }
      ),
      axios.post(
        `${API_BASE}/addresses`,
        {
          fullName: 'Concurrency User 2',
          phone: '9999990002',
          addressLine1: 'Test Address 2',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560002',
          country: 'India',
        },
        { headers: { Authorization: `Bearer ${token2}` } }
      ),
    ]);
    const addr1Id = addr1Res.data.data.id;
    const addr2Id = addr2Res.data.data.id;

    // 4. Admin creates a limited product with Stock = 1
    const testSku = `CONCUR-TEST-${Date.now()}`;
    const productRes = await axios.post(
      `${API_BASE}/admin/products`,
      {
        name: 'Limited Edition Rare Watch',
        description: 'Only 1 unit available in the entire world.',
        sku: testSku,
        price: 50000,
        discountPercent: 10,
        stockQuantity: 1,
        categoryId: 1,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const limitedProductId = productRes.data.data.id;
    console.log(`✅ Created limited product #${limitedProductId} with stock = 1.`);

    // 5. Both users add this item to their cart
    await Promise.all([
      axios.post(
        `${API_BASE}/cart/items`,
        { productId: limitedProductId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token1}` } }
      ),
      axios.post(
        `${API_BASE}/cart/items`,
        { productId: limitedProductId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token2}` } }
      ),
    ]);
    console.log('✅ Both users added the single item to their respective carts.');

    // 6. Launch 2 simultaneous checkout requests at the exact same millisecond!
    console.log('⚡ Firing 2 simultaneous checkout requests for the 1 remaining item...');
    const results = await Promise.allSettled([
      axios.post(
        `${API_BASE}/orders`,
        {
          addressId: addr1Id,
          paymentMethod: 'MOCK_CARD',
          paymentDetails: { cardNumber: '4111111111111111' },
        },
        { headers: { Authorization: `Bearer ${token1}` } }
      ),
      axios.post(
        `${API_BASE}/orders`,
        {
          addressId: addr2Id,
          paymentMethod: 'MOCK_CARD',
          paymentDetails: { cardNumber: '4111111111111111' },
        },
        { headers: { Authorization: `Bearer ${token2}` } }
      ),
    ]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    console.log(`📊 Concurrency Result: ${successes.length} Succeeded, ${failures.length} Rejected.`);

    if (successes.length === 1 && failures.length === 1) {
      console.log('🏆 SUCCESS: Exactly 1 user purchased the item, 1 user was safely rejected!');
      const failureReason = failures[0].reason.response?.data?.message;
      console.log(`🛡️ Rejected order message: "${failureReason}"`);

      // 7. Verify inventory in database is exactly 0 and status is OUT_OF_STOCK
      const finalProductRes = await axios.get(`${API_BASE}/products/${limitedProductId}`);
      const finalProduct = finalProductRes.data.data;
      console.log(`📦 Final product stock: ${finalProduct.stockQuantity}, status: ${finalProduct.status}`);

      if (finalProduct.stockQuantity === 0 && finalProduct.status === 'OUT_OF_STOCK') {
        console.log('✅ Database stock correctly decremented to 0 and marked OUT_OF_STOCK.');
      } else {
        console.error('❌ Stock level discrepancy!');
      }
    } else {
      console.error('❌ Race condition failure: Unexpected number of purchases!');
    }
  } catch (err) {
    console.error('Test error:', err.response?.data || err.message);
  }
}

runVerification();
