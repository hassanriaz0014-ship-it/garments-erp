require('dotenv').config({ path: __dirname + '/.env' });
const bcrypt = require('bcryptjs');
const db = require('./db');

async function resetPassword() {
  const hash = await bcrypt.hash('admin123', 10);
  await db.query(
    'UPDATE users SET password = $1 WHERE username = $2',
    [hash, 'admin']
  );
  console.log('✅ Password reset to: admin123');
  process.exit();
}

resetPassword();