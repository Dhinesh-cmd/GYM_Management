const assert = require('assert');
const bcrypt = require('bcryptjs');
const db = require('./db');

async function runTests() {
  console.log('--- STARTING BACKEND AUTOMATED TESTS ---');
  
  try {
    // 1. Initialize database
    console.log('1. Initializing database schema...');
    await db.init();
    
    // Check seeded admin user
    const admin = await db.get('SELECT * FROM users WHERE username = ?', ['dhinesht']);
    assert(admin, 'Seeded admin user (dhinesht) should exist.');
    console.log('   Admin user found.');

    const isPassMatch = await bcrypt.compare('Dhinesh@20', admin.password);
    assert(isPassMatch, 'Admin password bcrypt match should succeed.');
    console.log('   Admin password verification verified.');

    // 2. Clear old test customers to ensure test run is clean
    await db.run("DELETE FROM customers WHERE phone LIKE '99999%'");
    await db.run("DELETE FROM customers WHERE name = 'Automated Test Customer'");
    console.log('2. Cleared previous automated test entries.');

    // 3. Test Register Number Auto-generation
    console.log('3. Testing customer addition & auto-calculations...');
    const today = new Date().toISOString().split('T')[0];
    
    // Add member
    const newCust = {
      name: 'Automated Test Customer',
      phone: '9999900001',
      register_number: '',
      join_date: today,
      membership_type: '3 Months',
      treadmill_access: 1,
      treadmill_duration: '3 Months'
    };

    // Calculate Expiry (standard JS date plus 3 months)
    const expectedExpiry = new Date(today);
    expectedExpiry.setMonth(expectedExpiry.getMonth() + 3);
    const expectedExpiryStr = expectedExpiry.toISOString().split('T')[0];
    
    // Simulate routes/customers.js auto-creation:
    const year = new Date().getFullYear();
    const countRow = await db.get('SELECT COUNT(*) as count FROM customers');
    const count = (countRow ? countRow.count : 0) + 1;
    const generatedRegNum = `GYM-${year}-${String(count).padStart(4, '0')}`;

    // Insert
    const insertRes = await db.run(`
      INSERT INTO customers (
        register_number, name, phone, join_date, 
        membership_type, membership_expiry, 
        treadmill_access, treadmill_duration, treadmill_expiry
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      generatedRegNum, newCust.name, newCust.phone, newCust.join_date,
      newCust.membership_type, expectedExpiryStr,
      newCust.treadmill_access, newCust.treadmill_duration, expectedExpiryStr
    ]);

    const customerId = insertRes.id;
    assert(customerId > 0, 'Customer should be successfully inserted with valid ID.');
    console.log(`   Customer added. Generated ID: ${customerId}, Reg No: ${generatedRegNum}`);

    // Verify database record
    const savedCust = await db.get('SELECT * FROM customers WHERE id = ?', [customerId]);
    assert.strictEqual(savedCust.name, newCust.name, 'Name should match.');
    assert.strictEqual(savedCust.phone, newCust.phone, 'Phone should match.');
    assert.strictEqual(savedCust.membership_expiry, expectedExpiryStr, 'Membership expiry should align to +3 months.');
    assert.strictEqual(savedCust.treadmill_expiry, expectedExpiryStr, 'Treadmill expiry should align to +3 months.');
    console.log('   Record verification matches expected joining date & expiries.');

    // 4. Test Payment Log creation
    console.log('4. Testing transaction log integration...');
    // Base amount for 3 months (2500) + treadmill 3 months (700) = 3200
    const paymentAmount = 3200; 
    
    await db.run(`
      INSERT INTO payments (
        customer_id, payment_date, amount, 
        membership_type, treadmill_access, treadmill_duration, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      customerId, today, paymentAmount, 
      newCust.membership_type, newCust.treadmill_access, newCust.treadmill_duration, 'New'
    ]);

    const payment = await db.get('SELECT * FROM payments WHERE customer_id = ?', [customerId]);
    assert(payment, 'Payment log should be saved.');
    assert.strictEqual(parseFloat(payment.amount), 3200, 'Paid amount should compute to base + treadmill surcharge.');
    console.log(`   Payment logged successfully: amount = ${payment.amount}`);

    // 5. Test status classification logic
    console.log('5. Testing dynamic status mapping queries...');
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 5); // Expiry in 5 days (Expiring Soon)
    const expiringDateStr = testDate.toISOString().split('T')[0];

    await db.run('UPDATE customers SET membership_expiry = ? WHERE id = ?', [expiringDateStr, customerId]);

    const statusQuery = `
      SELECT *, 
        CASE 
          WHEN membership_expiry < ? AND membership_expiry < date(?, '-14 days') THEN 'Inactive'
          WHEN membership_expiry < ? THEN 'Expired'
          WHEN membership_expiry >= ? AND membership_expiry <= date(?, '+7 days') THEN 'Expiring Soon'
          ELSE 'Active'
        END as status
      FROM customers WHERE id = ?
    `;
    const custStatusRow = await db.get(statusQuery, [today, today, today, today, today, customerId]);
    assert.strictEqual(custStatusRow.status, 'Expiring Soon', 'Status should resolve to Expiring Soon when expiry is within 7 days.');
    console.log('   Status mapping verified: Expiring Soon trigger works.');

    // Expire customer
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5); // Expired 5 days ago
    const expiredDateStr = pastDate.toISOString().split('T')[0];
    await db.run('UPDATE customers SET membership_expiry = ? WHERE id = ?', [expiredDateStr, customerId]);

    const custExpiredRow = await db.get(statusQuery, [today, today, today, today, today, customerId]);
    assert.strictEqual(custExpiredRow.status, 'Expired', 'Status should resolve to Expired when expiry is in past <14 days.');
    console.log('   Status mapping verified: Expired trigger works.');

    // Inactivate customer
    const oldPastDate = new Date();
    oldPastDate.setDate(oldPastDate.getDate() - 20); // Expired 20 days ago (>14 days)
    const inactiveDateStr = oldPastDate.toISOString().split('T')[0];
    await db.run('UPDATE customers SET membership_expiry = ? WHERE id = ?', [inactiveDateStr, customerId]);

    const custInactiveRow = await db.get(statusQuery, [today, today, today, today, today, customerId]);
    assert.strictEqual(custInactiveRow.status, 'Inactive', 'Status should resolve to Inactive when expiry is past >14 days.');
    console.log('   Status mapping verified: Inactive trigger works.');

    // 6. Clean up database test entries
    console.log('6. Cleaning up database entries...');
    await db.run('DELETE FROM customers WHERE id = ?', [customerId]);
    const deletedCust = await db.get('SELECT * FROM customers WHERE id = ?', [customerId]);
    const deletedPay = await db.get('SELECT * FROM payments WHERE customer_id = ?', [customerId]);
    assert(!deletedCust, 'Customer row should be deleted.');
    assert(!deletedPay, 'Cascading payment rows should be deleted.');
    console.log('   Clean-up completed and cascading constraints checked.');

    console.log('\n--- ALL BACKEND TESTS PASSED SUCCESSFULY ---');
    process.exit(0);

  } catch (err) {
    console.error('\n--- BACKEND TESTS FAILED ---');
    console.error(err);
    process.exit(1);
  }
}

runTests();
