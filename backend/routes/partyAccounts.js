const express = require('express');
const router = express.Router();
const db = require('../db');
const protect = require('../middleware/auth');

// GET all accounts for a party
router.get('/:party_id', protect, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM party_accounts WHERE party_id = $1 ORDER BY created_at ASC',
      [req.params.party_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST — add account for a party
router.post('/', protect, async (req, res) => {
  const { party_id, account_name, bank_name, account_no } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO party_accounts (party_id, account_name, bank_name, account_no)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [party_id, account_name, bank_name, account_no]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE — remove an account
router.delete('/:id', protect, async (req, res) => {
  try {
    await db.query('DELETE FROM party_accounts WHERE id = $1', [req.params.id]);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;