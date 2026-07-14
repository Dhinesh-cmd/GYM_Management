const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Utility function to add months safely (prevents overflow)
function addMonths(dateStr, durationStr) {
  const d = new Date(dateStr);
  const day = d.getDate();
  
  let months = 1;
  if (durationStr === '1 Month') months = 1;
  else if (durationStr === '2 Months') months = 2;
  else if (durationStr === '3 Months') months = 3;
  else if (durationStr === '6 Months') months = 6;
  else if (durationStr === '1 Year') months = 12;

  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) {
    d.setDate(0); // Set to last day of previous month
  }
  return d.toISOString().split('T')[0];
}

// Utility to calculate membership pricing
function calculateAmount(membershipType, treadmillAccess, treadmillDuration) {
  let baseAmount = 0;
  switch (membershipType) {
    case '1 Month': baseAmount = 1000; break;
    case '2 Months': baseAmount = 1800; break;
    case '3 Months': baseAmount = 2500; break;
    case '6 Months': baseAmount = 4500; break;
    case '1 Year': baseAmount = 8000; break;
    default: baseAmount = 0;
  }

  let treadmillAmount = 0;
  if (treadmillAccess === 1 || treadmillAccess === true) {
    const duration = treadmillDuration || membershipType;
    switch (duration) {
      case '1 Month': treadmillAmount = 300; break;
      case '2 Months': treadmillAmount = 500; break;
      case '3 Months': treadmillAmount = 700; break;
      case '6 Months': treadmillAmount = 1200; break;
      case '1 Year': treadmillAmount = 2000; break;
      default: treadmillAmount = 0;
    }
  }
  return baseAmount + treadmillAmount;
}

// Generate unique register number
async function generateRegisterNumber() {
  const year = new Date().getFullYear();
  const countRow = await db.get('SELECT COUNT(*) as count FROM customers');
  const count = (countRow ? countRow.count : 0) + 1;
  let regNum = `GYM-${year}-${String(count).padStart(4, '0')}`;
  
  let exists = await db.get('SELECT id FROM customers WHERE register_number = ?', [regNum]);
  let attempts = 0;
  while (exists && attempts < 20) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    regNum = `GYM-${year}-${rand}`;
    exists = await db.get('SELECT id FROM customers WHERE register_number = ?', [regNum]);
    attempts++;
  }
  return regNum;
}

// @route   GET /api/customers
// @desc    Get paginated customers list with search, sorting and filters
router.get('/', auth, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Parse Query Parameters
  let { 
    search = '', 
    status = '', 
    membership = '', 
    treadmill = '', 
    sortBy = 'newest', 
    page = 1, 
    limit = 10 
  } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);
  const offset = (page - 1) * limit;

  // Build CTE Subquery to handle dynamic status
  let baseQuery = `
    WITH customer_status AS (
      SELECT *, 
        CASE 
          WHEN membership_expiry < ? AND membership_expiry < date(?, '-14 days') THEN 'Inactive'
          WHEN membership_expiry < ? THEN 'Expired'
          WHEN membership_expiry >= ? AND membership_expiry <= date(?, '+7 days') THEN 'Expiring Soon'
          ELSE 'Active'
        END as status,
        CAST((julianday(membership_expiry) - julianday(?)) AS INTEGER) as remaining_days,
        CAST((julianday(?) - julianday(membership_expiry)) AS INTEGER) as expired_since
      FROM customers
    )
    SELECT * FROM customer_status WHERE 1=1
  `;

  // Bind parameters for status calculation
  let params = [today, today, today, today, today, today, today];

  // Filters
  if (search.trim() !== '') {
    const searchVal = `%${search.trim()}%`;
    baseQuery += ` AND (name LIKE ? OR phone LIKE ? OR register_number LIKE ?)`;
    params.push(searchVal, searchVal, searchVal);
  }

  if (status !== '') {
    baseQuery += ` AND status = ?`;
    params.push(status);
  }

  if (membership !== '') {
    baseQuery += ` AND membership_type = ?`;
    params.push(membership);
  }

  if (treadmill !== '') {
    baseQuery += ` AND treadmill_access = ?`;
    const treadVal = treadmill === 'yes' ? 1 : 0;
    params.push(treadVal);
  }

  // Clone params for count query and replace query selection
  const countParams = [...params];
  const countQuery = baseQuery.replace('SELECT * FROM customer_status', 'SELECT COUNT(*) as total FROM customer_status');

  // Sorting
  let orderClause = '';
  switch (sortBy) {
    case 'oldest':
      orderClause = ' ORDER BY join_date ASC, id ASC';
      break;
    case 'alphabetical':
      orderClause = ' ORDER BY name ASC';
      break;
    case 'expiry':
      orderClause = ' ORDER BY membership_expiry ASC';
      break;
    case 'newest':
    default:
      orderClause = ' ORDER BY join_date DESC, id DESC';
  }
  
  baseQuery += orderClause;
  baseQuery += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const totalRow = await db.get(countQuery, countParams);
    const totalRecords = totalRow ? totalRow.total : 0;
    const totalPages = Math.ceil(totalRecords / limit);

    const customers = await db.all(baseQuery, params);

    res.json({
      customers,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (err) {
    console.error('Fetch customers error:', err);
    res.status(500).json({ error: 'Server error retrieving customers.' });
  }
});

// @route   GET /api/customers/stats
// @desc    Retrieve dynamic system stats for dashboard cards and notification alerts
router.get('/stats', auth, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = today.substring(0, 7) + '-01';

  try {
    // Dynamic statuses subquery
    const statsQuery = `
      WITH customer_status AS (
        SELECT id, join_date,
          CASE 
            WHEN membership_expiry < ? AND membership_expiry < date(?, '-14 days') THEN 'Inactive'
            WHEN membership_expiry < ? THEN 'Expired'
            WHEN membership_expiry >= ? AND membership_expiry <= date(?, '+7 days') THEN 'Expiring Soon'
            ELSE 'Active'
          END as status,
          CAST((julianday(membership_expiry) - julianday(?)) AS INTEGER) as remaining_days
        FROM customers
      )
      SELECT 
        COUNT(id) as total,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'Expiring Soon' THEN 1 ELSE 0 END) as expiringSoon,
        SUM(CASE WHEN status = 'Expired' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN join_date = ? THEN 1 ELSE 0 END) as newToday,
        SUM(CASE WHEN remaining_days = 1 THEN 1 ELSE 0 END) as expiresTomorrow,
        SUM(CASE WHEN remaining_days >= 0 AND remaining_days <= 7 THEN 1 ELSE 0 END) as expiresThisWeek
      FROM customer_status;
    `;
    const params = [today, today, today, today, today, today, today];
    const stats = await db.get(statsQuery, params);

    // Monthly Revenue
    const revRow = await db.get(
      'SELECT SUM(amount) as revenue FROM payments WHERE payment_date >= ? AND payment_date <= ?',
      [startOfMonth, today]
    );
    const revenueThisMonth = revRow ? (revRow.revenue || 0) : 0;

    res.json({
      totalMembers: stats.total || 0,
      activeMembers: stats.active || 0,
      expiringSoon: stats.expiringSoon || 0,
      expiredMembers: stats.expired || 0,
      inactiveMembers: stats.inactive || 0,
      newMembersToday: stats.newToday || 0,
      revenueThisMonth,
      notifications: {
        expiresTomorrow: stats.expiresTomorrow || 0,
        expiresThisWeek: stats.expiresThisWeek || 0,
        inactiveAlerts: stats.inactive || 0
      }
    });
  } catch (err) {
    console.error('Fetch stats error:', err);
    res.status(500).json({ error: 'Server error compiling statistics.' });
  }
});

// @route   GET /api/customers/:id
// @desc    Get detailed customer profile, including payment history and remaining days
router.get('/:id', auth, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { id } = req.params;

  try {
    const customerQuery = `
      SELECT *, 
        CASE 
          WHEN membership_expiry < ? AND membership_expiry < date(?, '-14 days') THEN 'Inactive'
          WHEN membership_expiry < ? THEN 'Expired'
          WHEN membership_expiry >= ? AND membership_expiry <= date(?, '+7 days') THEN 'Expiring Soon'
          ELSE 'Active'
        END as status,
        CAST((julianday(membership_expiry) - julianday(?)) AS INTEGER) as remaining_days,
        CAST((julianday(?) - julianday(membership_expiry)) AS INTEGER) as expired_since
      FROM customers
      WHERE id = ?
    `;
    const customer = await db.get(customerQuery, [today, today, today, today, today, today, id]);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const payments = await db.all('SELECT * FROM payments WHERE customer_id = ? ORDER BY payment_date DESC', [id]);

    res.json({
      customer,
      payments
    });
  } catch (err) {
    console.error('Get customer profile error:', err);
    res.status(500).json({ error: 'Server error retrieving customer profile.' });
  }
});

// @route   POST /api/customers
// @desc    Register a new customer
router.post('/', auth, async (req, res) => {
  let { 
    name, 
    phone, 
    register_number, 
    join_date, 
    membership_type, 
    treadmill_access, 
    treadmill_duration 
  } = req.body;

  // Validation
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Customer name is required.' });
  }
  if (!phone || phone.trim() === '') {
    return res.status(400).json({ error: 'Phone number is required.' });
  }
  
  // Clean phone input and match 10-digit requirements
  const cleanedPhone = phone.replace(/\D/g, '');
  if (cleanedPhone.length !== 10) {
    return res.status(400).json({ error: 'Phone number must contain exactly 10 digits.' });
  }

  // Set default join date if empty
  if (!join_date) {
    join_date = new Date().toISOString().split('T')[0];
  }

  try {
    // Check duplicate phone number
    const dupPhone = await db.get('SELECT id FROM customers WHERE phone = ?', [cleanedPhone]);
    if (dupPhone) {
      return res.status(400).json({ error: 'A customer with this phone number already exists.' });
    }

    // Handle register number
    if (register_number && register_number.trim() !== '') {
      const dupReg = await db.get('SELECT id FROM customers WHERE register_number = ?', [register_number.trim()]);
      if (dupReg) {
        return res.status(400).json({ error: 'A customer with this register number already exists.' });
      }
      register_number = register_number.trim();
    } else {
      register_number = await generateRegisterNumber();
    }

    // Calculate Expiries
    const membership_expiry = addMonths(join_date, membership_type);
    
    let treadmill_access_val = treadmill_access === true || treadmill_access === 1 ? 1 : 0;
    let treadmill_duration_val = null;
    let treadmill_expiry = null;

    if (treadmill_access_val === 1) {
      treadmill_duration_val = treadmill_duration || membership_type;
      treadmill_expiry = addMonths(join_date, treadmill_duration_val);
    }

    // Insert customer
    const insertCust = await db.run(`
      INSERT INTO customers (
        register_number, name, phone, join_date, 
        membership_type, membership_expiry, 
        treadmill_access, treadmill_duration, treadmill_expiry
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      register_number, name.trim(), cleanedPhone, join_date,
      membership_type, membership_expiry,
      treadmill_access_val, treadmill_duration_val, treadmill_expiry
    ]);

    const customerId = insertCust.id;

    // Calculate Payment and Log History
    const paymentAmount = calculateAmount(membership_type, treadmill_access_val, treadmill_duration_val);
    await db.run(`
      INSERT INTO payments (
        customer_id, payment_date, amount, 
        membership_type, treadmill_access, treadmill_duration, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      customerId, join_date, paymentAmount, 
      membership_type, treadmill_access_val, treadmill_duration_val, 'New'
    ]);

    res.status(201).json({ 
      success: true, 
      message: 'Customer registered successfully.', 
      customerId,
      registerNumber: register_number
    });

  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ error: 'Server error registering customer.' });
  }
});

// @route   PUT /api/customers/:id
// @desc    Edit existing customer information
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  let { 
    name, 
    phone, 
    register_number, 
    join_date, 
    membership_type, 
    treadmill_access, 
    treadmill_duration 
  } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Customer name is required.' });
  }
  if (!phone || phone.trim() === '') {
    return res.status(400).json({ error: 'Phone number is required.' });
  }

  const cleanedPhone = phone.replace(/\D/g, '');
  if (cleanedPhone.length !== 10) {
    return res.status(400).json({ error: 'Phone number must contain exactly 10 digits.' });
  }

  try {
    const customer = await db.get('SELECT * FROM customers WHERE id = ?', [id]);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // Check duplicate phone
    const dupPhone = await db.get('SELECT id FROM customers WHERE phone = ? AND id != ?', [cleanedPhone, id]);
    if (dupPhone) {
      return res.status(400).json({ error: 'Another customer with this phone number already exists.' });
    }

    // Check duplicate register number
    if (register_number && register_number.trim() !== '') {
      const dupReg = await db.get('SELECT id FROM customers WHERE register_number = ? AND id != ?', [register_number.trim(), id]);
      if (dupReg) {
        return res.status(400).json({ error: 'Another customer with this register number already exists.' });
      }
      register_number = register_number.trim();
    } else {
      register_number = customer.register_number; // Revert to old if empty
    }

    // If membership_type changed, recalculate expiry date from original join_date or keep old expiry. 
    // Standard rule: recalculate relative to joining date if it changed, or keep it.
    let membership_expiry = customer.membership_expiry;
    if (membership_type !== customer.membership_type || join_date !== customer.join_date) {
      membership_expiry = addMonths(join_date, membership_type);
    }

    let treadmill_access_val = treadmill_access === true || treadmill_access === 1 ? 1 : 0;
    let treadmill_duration_val = null;
    let treadmill_expiry = null;

    if (treadmill_access_val === 1) {
      treadmill_duration_val = treadmill_duration || membership_type;
      if (treadmill_access_val !== customer.treadmill_access || treadmill_duration_val !== customer.treadmill_duration || join_date !== customer.join_date) {
        treadmill_expiry = addMonths(join_date, treadmill_duration_val);
      } else {
        treadmill_expiry = customer.treadmill_expiry;
      }
    }

    await db.run(`
      UPDATE customers 
      SET register_number = ?, name = ?, phone = ?, join_date = ?, 
          membership_type = ?, membership_expiry = ?, 
          treadmill_access = ?, treadmill_duration = ?, treadmill_expiry = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      register_number, name.trim(), cleanedPhone, join_date,
      membership_type, membership_expiry,
      treadmill_access_val, treadmill_duration_val, treadmill_expiry,
      id
    ]);

    res.json({ success: true, message: 'Customer updated successfully.' });
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ error: 'Server error updating customer profile.' });
  }
});

// @route   POST /api/customers/:id/renew
// @desc    Renew customer membership, auto-update expiry, and log payment history
router.post('/:id/renew', auth, async (req, res) => {
  const { id } = req.params;
  const { 
    membership_type, 
    treadmill_access, 
    treadmill_duration 
  } = req.body;

  if (!membership_type) {
    return res.status(400).json({ error: 'Membership type is required.' });
  }

  try {
    const customer = await db.get('SELECT * FROM customers WHERE id = ?', [id]);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Renewal Expiry calculation rule:
    // If the membership is active, extend it from the CURRENT expiry date.
    // If it has expired, extend it from TODAY.
    let baseDate = customer.membership_expiry;
    if (customer.membership_expiry < today) {
      baseDate = today;
    }

    const newMembershipExpiry = addMonths(baseDate, membership_type);

    let treadmill_access_val = treadmill_access === true || treadmill_access === 1 ? 1 : 0;
    let treadmill_duration_val = null;
    let treadmill_expiry = null;

    if (treadmill_access_val === 1) {
      treadmill_duration_val = treadmill_duration || membership_type;
      
      // Treadmill expiry calculations: extend from old treadmill expiry or today.
      let baseTreadmillDate = customer.treadmill_expiry || today;
      if (!customer.treadmill_expiry || customer.treadmill_expiry < today) {
        baseTreadmillDate = today;
      }
      treadmill_expiry = addMonths(baseTreadmillDate, treadmill_duration_val);
    }

    // Update Customer details
    await db.run(`
      UPDATE customers 
      SET membership_type = ?, membership_expiry = ?, 
          treadmill_access = ?, treadmill_duration = ?, treadmill_expiry = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      membership_type, newMembershipExpiry,
      treadmill_access_val, treadmill_duration_val, treadmill_expiry,
      id
    ]);

    // Calculate Payment amount
    const paymentAmount = calculateAmount(membership_type, treadmill_access_val, treadmill_duration_val);
    
    // Log renewal payment
    await db.run(`
      INSERT INTO payments (
        customer_id, payment_date, amount, 
        membership_type, treadmill_access, treadmill_duration, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id, today, paymentAmount, 
      membership_type, treadmill_access_val, treadmill_duration_val, 'Renewal'
    ]);

    res.json({ 
      success: true, 
      message: 'Membership renewed successfully.',
      newExpiry: newMembershipExpiry 
    });

  } catch (err) {
    console.error('Membership renewal error:', err);
    res.status(500).json({ error: 'Server error during membership renewal.' });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete a customer profile
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  try {
    const customer = await db.get('SELECT id FROM customers WHERE id = ?', [id]);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // SQLite Cascade deletes payments automatically because of FOREIGN KEY constraint
    await db.run('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ success: true, message: 'Customer profile deleted.' });
  } catch (err) {
    console.error('Delete customer error:', err);
    res.status(500).json({ error: 'Server error deleting customer profile.' });
  }
});

// @route   POST /api/customers/import
// @desc    Batch import customer profiles parsed on the client
router.post('/import', auth, async (req, res) => {
  const { customers } = req.body;

  if (!Array.isArray(customers) || customers.length === 0) {
    return res.status(400).json({ error: 'Invalid data format or empty list.' });
  }

  let importedCount = 0;
  let errors = [];

  try {
    for (let i = 0; i < customers.length; i++) {
      let { 
        name, 
        phone, 
        register_number, 
        join_date, 
        membership_type, 
        treadmill_access, 
        treadmill_duration 
      } = customers[i];

      // Quick validation
      if (!name || !phone) {
        errors.push(`Row ${i + 1}: Name and phone number are required.`);
        continue;
      }

      const cleanedPhone = String(phone).replace(/\D/g, '');
      if (cleanedPhone.length !== 10) {
        errors.push(`Row ${i + 1} (${name}): Phone number must contain exactly 10 digits.`);
        continue;
      }

      // Check duplicates
      const dupPhone = await db.get('SELECT id FROM customers WHERE phone = ?', [cleanedPhone]);
      if (dupPhone) {
        errors.push(`Row ${i + 1} (${name}): Phone number ${cleanedPhone} already registered.`);
        continue;
      }

      if (register_number) {
        register_number = String(register_number).trim();
        const dupReg = await db.get('SELECT id FROM customers WHERE register_number = ?', [register_number]);
        if (dupReg) {
          errors.push(`Row ${i + 1} (${name}): Register number ${register_number} already registered.`);
          continue;
        }
      } else {
        register_number = await generateRegisterNumber();
      }

      if (!join_date) {
        join_date = new Date().toISOString().split('T')[0];
      }

      // Standardize membership values
      const validMemberships = ['1 Month', '2 Months', '3 Months', '6 Months', '1 Year'];
      if (!validMemberships.includes(membership_type)) {
        membership_type = '1 Month'; // Default
      }

      const membership_expiry = addMonths(join_date, membership_type);
      
      let treadmill_access_val = treadmill_access === true || treadmill_access === 1 || String(treadmill_access).toLowerCase() === 'yes' ? 1 : 0;
      let treadmill_duration_val = null;
      let treadmill_expiry = null;

      if (treadmill_access_val === 1) {
        treadmill_duration_val = treadmill_duration || membership_type;
        if (!validMemberships.includes(treadmill_duration_val)) {
          treadmill_duration_val = membership_type;
        }
        treadmill_expiry = addMonths(join_date, treadmill_duration_val);
      }

      // Insert member
      const result = await db.run(`
        INSERT INTO customers (
          register_number, name, phone, join_date, 
          membership_type, membership_expiry, 
          treadmill_access, treadmill_duration, treadmill_expiry
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        register_number, name.trim(), cleanedPhone, join_date,
        membership_type, membership_expiry,
        treadmill_access_val, treadmill_duration_val, treadmill_expiry
      ]);

      // Calculate Payment and Log History
      const paymentAmount = calculateAmount(membership_type, treadmill_access_val, treadmill_duration_val);
      await db.run(`
        INSERT INTO payments (
          customer_id, payment_date, amount, 
          membership_type, treadmill_access, treadmill_duration, type
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        result.id, join_date, paymentAmount, 
        membership_type, treadmill_access_val, treadmill_duration_val, 'New'
      ]);

      importedCount++;
    }

    res.json({
      success: true,
      importedCount,
      errors
    });

  } catch (err) {
    console.error('Batch import error:', err);
    res.status(500).json({ error: 'Server error processing batch import.' });
  }
});

module.exports = router;
