const express = require('express');
const router = express.Router();
const db = require('../db');
const protect = require('../middleware/auth');

// GET all accessories
router.get('/', protect, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM accessories ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET accessories by party
router.get('/party/:party_id', protect, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM accessories WHERE party_id_owner = $1 ORDER BY created_at DESC',
      [req.params.party_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single accessory
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM accessories WHERE id = $1', [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Accessory not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST — add accessory for a specific party
router.post('/', protect, async (req, res) => {
  const { name, category, quantity, unit, unit_price, party_id_owner, notes } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO accessories (name, category, quantity, unit, unit_price, party_id_owner, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, category, quantity, unit, unit_price, party_id_owner, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT — update accessory
router.put('/:id', protect, async (req, res) => {
  const { name, category, quantity, unit, unit_price, notes } = req.body;
  try {
    const result = await db.query(
      `UPDATE accessories SET name=$1, category=$2, quantity=$3, unit=$4,
       unit_price=$5, notes=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [name, category, quantity, unit, unit_price, notes, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Accessory not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE
router.delete('/:id', protect, async (req, res) => {
  try {
    await db.query('DELETE FROM accessories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Accessory deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;