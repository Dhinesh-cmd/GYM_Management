const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Setup multer for DB restore file uploads
const upload = multer({ 
  dest: path.join(__dirname, '../../uploads/'),
  limits: { fileSize: 10 * 1024 * 1024 } // limit 10MB
});

// @route   POST /api/settings/update-profile
// @desc    Update admin username and password
router.post('/update-profile', auth, async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'Username is required.' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'Admin user not found.' });
    }

    const cleanUsername = username.toLowerCase().trim();

    // Check unique username if username is changing
    if (cleanUsername !== user.username) {
      const exists = await db.get('SELECT id FROM users WHERE username = ?', [cleanUsername]);
      if (exists) {
        return res.status(400).json({ error: 'Username is already taken.' });
      }
    }

    let passwordUpdate = false;
    let hashedNewPassword = '';

    if (newPassword && newPassword.trim() !== '') {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to change password.' });
      }
      
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password.' });
      }

      hashedNewPassword = await bcrypt.hash(newPassword, 10);
      passwordUpdate = true;
    }

    if (passwordUpdate) {
      await db.run('UPDATE users SET username = ?, password = ? WHERE id = ?', [cleanUsername, hashedNewPassword, req.user.id]);
    } else {
      await db.run('UPDATE users SET username = ? WHERE id = ?', [cleanUsername, req.user.id]);
    }

    res.json({ success: true, message: 'Profile updated successfully.' });

  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

// @route   GET /api/settings/export-data
// @desc    Retrieve all tables (customers & payments) in raw format for CSV/Excel client download
router.get('/export-data', auth, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    // Dynamic status calculation in dump
    const customersQuery = `
      SELECT *,
        CASE 
          WHEN membership_expiry < ? AND membership_expiry < date(?, '-14 days') THEN 'Inactive'
          WHEN membership_expiry < ? THEN 'Expired'
          WHEN membership_expiry >= ? AND membership_expiry <= date(?, '+7 days') THEN 'Expiring Soon'
          ELSE 'Active'
        END as status
      FROM customers;
    `;
    const customers = await db.all(customersQuery, [today, today, today, today, today]);
    const payments = await db.all('SELECT p.*, c.name as customer_name, c.register_number FROM payments p JOIN customers c ON p.customer_id = c.id ORDER BY p.payment_date DESC');

    res.json({
      customers,
      payments
    });
  } catch (err) {
    console.error('Export report error:', err);
    res.status(500).json({ error: 'Server error compiling database export.' });
  }
});

// @route   GET /api/settings/backup
// @desc    Download the SQLite binary file directly
router.get('/backup', auth, async (req, res) => {
  const dbFile = path.join(__dirname, '../gym.db');
  
  if (!fs.existsSync(dbFile)) {
    return res.status(404).json({ error: 'Database file not found.' });
  }

  // Set response headers for download
  const dateStr = new Date().toISOString().split('T')[0];
  res.download(dbFile, `gym_backup_${dateStr}.db`, (err) => {
    if (err) {
      console.error('Backup download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error downloading backup.' });
      }
    }
  });
});

// @route   POST /api/settings/restore
// @desc    Upload an SQLite backup file and replace gym.db
router.post('/restore', auth, upload.single('backupFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No backup file uploaded.' });
  }

  const uploadPath = req.file.path;
  const dbFile = path.join(__dirname, '../gym.db');

  try {
    // Check if uploaded file is a valid SQLite DB file
    // SQLite databases begin with "SQLite format 3\000" in hex
    const buffer = fs.readFileSync(uploadPath, { encoding: null, flag: 'r' });
    const header = buffer.toString('ascii', 0, 15);
    
    if (header !== 'SQLite format 3') {
      fs.unlinkSync(uploadPath); // delete temp file
      return res.status(400).json({ error: 'Uploaded file is not a valid SQLite database backup.' });
    }

    // Safely swap database:
    // 1. Close current connection
    await db.close();
    
    // 2. Overwrite the main gym.db
    fs.copyFileSync(uploadPath, dbFile);
    fs.unlinkSync(uploadPath); // delete temp file
    
    // 3. Re-open connection
    await db.reopen();

    console.log('Database successfully restored from backup.');
    res.json({ success: true, message: 'Database successfully restored from backup.' });

  } catch (err) {
    console.error('Database restore error:', err);
    
    // Attempt recovery of connection if something failed
    try {
      await db.reopen();
    } catch (reopenErr) {
      console.error('Critical database reconnection failure:', reopenErr);
    }
    
    if (fs.existsSync(uploadPath)) {
      fs.unlinkSync(uploadPath);
    }

    res.status(500).json({ error: 'Failed to restore database from backup file.' });
  }
});

// ==========================================================================
// WEB PUSH NOTIFICATION SERVICES
// ==========================================================================

const webpush = require('web-push');

// Load or generate VAPID keys for signing notifications
const vapidKeysFile = path.join(__dirname, '../vapid.json');
let vapidKeys;

if (fs.existsSync(vapidKeysFile)) {
  try {
    vapidKeys = JSON.parse(fs.readFileSync(vapidKeysFile, 'utf8'));
  } catch (e) {
    console.error('Error reading vapid.json, regenerating keys...', e);
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(vapidKeysFile, JSON.stringify(vapidKeys, null, 2), 'utf8');
  }
} else {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(vapidKeysFile, JSON.stringify(vapidKeys, null, 2), 'utf8');
}

webpush.setVapidDetails(
  'mailto:admin@pulsegym.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// @route   GET /api/settings/vapid-public-key
// @desc    Retrieve the public VAPID key for browser subscription
router.get('/vapid-public-key', auth, (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// @route   POST /api/settings/push-subscribe
// @desc    Register a new push subscription
router.post('/push-subscribe', auth, async (req, res) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Valid subscription object is required.' });
  }

  try {
    const keys = subscription.keys || {};
    const p256dh = keys.p256dh || '';
    const authKey = keys.auth || '';

    // Insert subscription, overwrite on conflict
    await db.run(
      'INSERT INTO push_subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth',
      [subscription.endpoint, p256dh, authKey]
    );

    res.json({ success: true, message: 'Push subscription registered.' });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ error: 'Server error registering push subscription.' });
  }
});

// @route   POST /api/settings/push-unsubscribe
// @desc    Unregister a push subscription
router.post('/push-unsubscribe', auth, async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required.' });
  }

  try {
    await db.run('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
    res.json({ success: true, message: 'Push subscription removed.' });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    res.status(500).json({ error: 'Server error removing subscription.' });
  }
});

// @route   POST /api/settings/push-test
// @desc    Trigger an immediate push notification test (smoke test)
router.post('/push-test', auth, async (req, res) => {
  console.log('[PUSH TEST] Received manual smoke test request...');
  try {
    const subscriptions = await db.all('SELECT * FROM push_subscriptions');
    if (subscriptions.length === 0) {
      console.log('[PUSH TEST] No active push subscriptions found.');
      return res.status(400).json({ error: 'No registered push subscriptions found. Please enable notifications first.' });
    }

    const payload = JSON.stringify({
      title: '🏋️ PulseGym Smoke Test',
      body: 'Hello! This is a test push notification. Native notifications are working perfectly.',
      icon: 'https://cdn-icons-png.flaticon.com/512/2964/2964063.png',
      url: '/'
    });

    console.log(`[PUSH TEST] Broadcasting test payload to ${subscriptions.length} active subscriptions...`);
    let sentCount = 0;
    let failCount = 0;

    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        console.log(`[PUSH TEST] Success sending notification to endpoint: ${sub.endpoint.slice(0, 45)}...`);
        sentCount++;
      } catch (err) {
        console.error(`[PUSH TEST] Failed sending notification to endpoint: ${sub.endpoint.slice(0, 45)}... Error:`, err.message || err);
        failCount++;
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log('[PUSH TEST] Removing dead/expired subscription endpoint...');
          await db.run('DELETE FROM push_subscriptions WHERE endpoint = ?', [sub.endpoint]);
        }
      }
    }

    res.json({ success: true, message: `Test push sent. Success: ${sentCount}, Failed: ${failCount}` });
  } catch (err) {
    console.error('[PUSH TEST] General push-test route failure:', err);
    res.status(500).json({ error: 'Server error triggering test notification.' });
  }
});

// Background loop running every 1 minute to check for expiring/expired members and send push alerts
setInterval(async () => {
  console.log('[PUSH SCHEDULER] Running scheduled 1-minute membership expiry check...');
  try {
    const subscriptions = await db.all('SELECT * FROM push_subscriptions');
    if (subscriptions.length === 0) {
      console.log('[PUSH SCHEDULER] No active push subscriptions found. Skipping notifications.');
      return;
    }

    console.log(`[PUSH SCHEDULER] Found ${subscriptions.length} active subscriptions. Checking database...`);

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Query databases for expiring tomorrow / expired today
    const expiringTomorrow = await db.all('SELECT name FROM customers WHERE membership_expiry = ?', [tomorrow]);
    const expiredToday = await db.all('SELECT name FROM customers WHERE membership_expiry = ?', [today]);

    let title = '🏋️ PulseGym Management';
    let body = '';

    if (expiringTomorrow.length > 0) {
      body = `Membership Reminder: ${expiringTomorrow.map(c => c.name).join(', ')}'s membership expires tomorrow. Renew now.`;
    } else if (expiredToday.length > 0) {
      title = '💰 Payment Reminder';
      body = `Membership Expired today for: ${expiredToday.map(c => c.name).join(', ')}.`;
    } else {
      body = 'PulseGym System Status: All members are currently up to date.';
    }

    console.log(`[PUSH SCHEDULER] Prepared notification message: "${title}: ${body}"`);

    const payload = JSON.stringify({
      title,
      body,
      icon: 'https://cdn-icons-png.flaticon.com/512/2964/2964063.png',
      url: '/'
    });

    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      console.log(`[PUSH SCHEDULER] Dispatching push request to standard push service for: ${sub.endpoint.slice(0, 45)}...`);
      webpush.sendNotification(pushSubscription, payload)
        .then(() => {
          console.log(`[PUSH SCHEDULER] Dispatch succeeded for endpoint: ${sub.endpoint.slice(0, 45)}...`);
        })
        .catch(err => {
          // If subscription has expired or is invalid, remove it
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log('[PUSH SCHEDULER] Push subscription expired, removing...');
            db.run('DELETE FROM push_subscriptions WHERE endpoint = ?', [sub.endpoint]).catch(console.error);
          } else {
            console.error('[PUSH SCHEDULER] Error sending push notification:', err.message || err);
          }
        });
    }
  } catch (err) {
    console.error('[PUSH SCHEDULER] Scheduled push notification error:', err);
  }
}, 60000);

module.exports = router;
