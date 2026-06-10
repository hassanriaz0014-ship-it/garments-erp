const express = require('express');
const router = express.Router();
const db = require('../db');
const protect = require('../middleware/auth');

// GET all parties — fetches everyone from the database
router.get('/', protect, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM parties ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single party by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM parties WHERE id = $1', [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Party not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST — add a new party
router.post('/', protect, async (req, res) => {
  const { name, type, contact_person, phone, email, address, city, notes } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO parties (name, type, contact_person, phone, email, address, city, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, type, contact_person, phone, email, address, city, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT — update an existing party
router.put('/:id', protect, async (req, res) => {
  const { name, type, contact_person, phone, email, address, city, notes } = req.body;
  try {
    const result = await db.query(
      `UPDATE parties SET name=$1, type=$2, contact_person=$3, phone=$4,
       email=$5, address=$6, city=$7, notes=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [name, type, contact_person, phone, email, address, city, notes, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Party not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE — remove a party by ID
router.delete('/:id', protect, async (req, res) => {
  try {
    await db.query('DELETE FROM parties WHERE id = $1', [req.params.id]);
    res.json({ message: 'Party deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;