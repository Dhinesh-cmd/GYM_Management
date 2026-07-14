const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'gym.db');
let db = new sqlite3.Database(dbPath);

// Enable foreign keys function
function enableForeignKeys(connection) {
  connection.serialize(() => {
    connection.run('PRAGMA foreign_keys = ON;');
  });
}

enableForeignKeys(db);

// Promise wrappers for clean async/await syntax
const dbUtils = {
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },

  exec(sql) {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  close() {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  reopen() {
    return new Promise((resolve, reject) => {
      db = new sqlite3.Database(dbPath, (err) => {
        if (err) reject(err);
        else {
          enableForeignKeys(db);
          resolve();
        }
      });
    });
  },

  // Database initial seeding and setup
  async init() {
    // Create Users table
    await this.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Push Subscriptions table
    await this.run(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Customers table
    await this.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        register_number VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        join_date DATE NOT NULL,
        membership_type VARCHAR(50) NOT NULL,
        membership_expiry DATE NOT NULL,
        treadmill_access INTEGER DEFAULT 0,
        treadmill_duration VARCHAR(50),
        treadmill_expiry DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Payments table
    await this.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        payment_date DATE NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        membership_type VARCHAR(50) NOT NULL,
        treadmill_access INTEGER DEFAULT 0,
        treadmill_duration VARCHAR(50),
        type VARCHAR(20) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      );
    `);

    // Seed default admin if table is empty
    const admin = await this.get('SELECT * FROM users WHERE username = ?', ['dhinesht']);
    if (!admin) {
      const hashedPassword = await bcrypt.hash('Dhinesh@20', 10);
      await this.run('INSERT INTO users (username, password) VALUES (?, ?)', ['dhinesht', hashedPassword]);
      console.log('Seeded default admin user (dhinesht).');
    }

    // Seed default customers if empty
    const customerCount = await this.get('SELECT COUNT(*) as count FROM customers');
    if (customerCount && customerCount.count === 0) {
      console.log('Seeding 20 default customer records for demo...');
      const today = new Date();
      
      const membersData = [
        { name: 'Dhinesh Kumar', phone: '9876543201', reg: 'GYM-2026-0001', offsetDays: -10, membership: '3 Months', treadmill: 1 },
        { name: 'Arun Prasath', phone: '9876543202', reg: 'GYM-2026-0002', offsetDays: -85, membership: '3 Months', treadmill: 1 }, // Expires in 5 days (Expiring Soon)
        { name: 'Vijay Anand', phone: '9876543203', reg: 'GYM-2026-0003', offsetDays: -88, membership: '3 Months', treadmill: 0 }, // Expires in 2 days (Expiring Soon)
        { name: 'Sanjay Dutt', phone: '9876543204', reg: 'GYM-2026-0004', offsetDays: -35, membership: '1 Month', treadmill: 0 }, // Expired 5 days ago
        { name: 'Keerthi Suresh', phone: '9876543205', reg: 'GYM-2026-0005', offsetDays: -50, membership: '1 Month', treadmill: 1 }, // Inactive (Expired 20 days ago)
        { name: 'Rohan Sharma', phone: '9876543206', reg: 'GYM-2026-0006', offsetDays: 0, membership: '6 Months', treadmill: 1 }, // Joined today
        { name: 'Priya Rajan', phone: '9876543207', reg: 'GYM-2026-0007', offsetDays: -15, membership: '1 Year', treadmill: 0 },
        { name: 'Karthik Raja', phone: '9876543208', reg: 'GYM-2026-0008', offsetDays: -45, membership: '6 Months', treadmill: 1 },
        { name: 'Ananya Panday', phone: '9876543209', reg: 'GYM-2026-0009', offsetDays: -120, membership: '6 Months', treadmill: 0 }, // Expires in ~2 months
        { name: 'Vikram Seth', phone: '9876543210', reg: 'GYM-2026-0010', offsetDays: -32, membership: '1 Month', treadmill: 0 }, // Expired 2 days ago
        { name: 'Shreya Ghoshal', phone: '9876543211', reg: 'GYM-2026-0011', offsetDays: -180, membership: '6 Months', treadmill: 1 }, // Expired today/yesterday
        { name: 'Manish Malhotra', phone: '9876543212', reg: 'GYM-2026-0012', offsetDays: -200, membership: '6 Months', treadmill: 0 }, // Inactive (Expired 20 days ago)
        { name: 'Sneha Reddy', phone: '9876543213', reg: 'GYM-2026-0013', offsetDays: -5, membership: '2 Months', treadmill: 1 },
        { name: 'Gautham Menon', phone: '9876543214', reg: 'GYM-2026-0014', offsetDays: -58, membership: '2 Months', treadmill: 1 }, // Expires in 2 days (Expiring Soon)
        { name: 'Nisha Aggarwal', phone: '9876543215', reg: 'GYM-2026-0015', offsetDays: -40, membership: '3 Months', treadmill: 0 },
        { name: 'Surya Sivakumar', phone: '9876543216', reg: 'GYM-2026-0016', offsetDays: -12, membership: '1 Year', treadmill: 1 },
        { name: 'Samantha Ruth', phone: '9876543217', reg: 'GYM-2026-0017', offsetDays: -360, membership: '1 Year', treadmill: 1 }, // Expires in 5 days (Expiring Soon)
        { name: 'Naveen Polishetty', phone: '9876543218', reg: 'GYM-2026-0018', offsetDays: -380, membership: '1 Year', treadmill: 0 }, // Inactive (Expired 15 days ago)
        { name: 'Rashmika Mandanna', phone: '9876543219', reg: 'GYM-2026-0019', offsetDays: -2, membership: '3 Months', treadmill: 1 },
        { name: 'Harish Kalyan', phone: '9876543220', reg: 'GYM-2026-0020', offsetDays: -120, membership: '1 Year', treadmill: 1 }
      ];

      function getDateOffsetStr(baseDate, offsetDays) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().split('T')[0];
      }

      function addMonthsToDate(dateStr, durationStr) {
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
          d.setDate(0);
        }
        return d.toISOString().split('T')[0];
      }

      function getPlanAmount(membershipType, treadmillAccess) {
        let baseAmount = 0;
        switch (membershipType) {
          case '1 Month': baseAmount = 1000; break;
          case '2 Months': baseAmount = 1800; break;
          case '3 Months': baseAmount = 2500; break;
          case '6 Months': baseAmount = 4500; break;
          case '1 Year': baseAmount = 8000; break;
        }

        let treadmillAmount = 0;
        if (treadmillAccess) {
          switch (membershipType) {
            case '1 Month': treadmillAmount = 300; break;
            case '2 Months': treadmillAmount = 500; break;
            case '3 Months': treadmillAmount = 700; break;
            case '6 Months': treadmillAmount = 1200; break;
            case '1 Year': treadmillAmount = 2000; break;
          }
        }
        return baseAmount + treadmillAmount;
      }

      for (const m of membersData) {
        const joinDate = getDateOffsetStr(today, m.offsetDays);
        const expiryDate = addMonthsToDate(joinDate, m.membership);
        const treadmillExpiry = m.treadmill ? addMonthsToDate(joinDate, m.membership) : null;

        const result = await this.run(`
          INSERT INTO customers (
            register_number, name, phone, join_date, 
            membership_type, membership_expiry, 
            treadmill_access, treadmill_duration, treadmill_expiry
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          m.reg, m.name, m.phone, joinDate,
          m.membership, expiryDate,
          m.treadmill, m.treadmill ? m.membership : null, treadmillExpiry
        ]);

        const amt = getPlanAmount(m.membership, m.treadmill);
        await this.run(`
          INSERT INTO payments (
            customer_id, payment_date, amount, 
            membership_type, treadmill_access, treadmill_duration, type
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          result.id, joinDate, amt, 
          m.membership, m.treadmill, m.treadmill ? m.membership : null, 'New'
        ]);
      }
      console.log('Seeded 20 default customer profiles and payment logs.');
    }
  }
};

module.exports = dbUtils;
