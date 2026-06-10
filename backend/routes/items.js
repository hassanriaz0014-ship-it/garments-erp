const express = require('express');
const router = express.Router();
const db = require('../db');
const protect = require('../middleware/auth');

// GET all items
router.get('/', protect, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM items ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET items by party
router.get('/party/:party_id', protect, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM items WHERE party_id = $1 ORDER BY created_at DESC',
      [req.params.party_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single item
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM items WHERE id = $1', [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET item by style number
router.get('/style/:style_no', protect, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM items WHERE style_no = $1', [req.params.style_no]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Style not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST — add item for a specific party
router.post('/', protect, async (req, res) => {
  const { style_no, description, color, size, price, image_url, party_id } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO items (style_no, description, color, size, price, image_url, party_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [style_no, description, color, size, price, image_url, party_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT — update item
router.put('/:id', protect, async (req, res) => {
  const { style_no, description, color, size, price, image_url } = req.body;
  try {
    const result = await db.query(
      `UPDATE items SET style_no=$1, description=$2, color=$3, size=$4,
       price=$5, image_url=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [style_no, description, color, size, price, image_url, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE
router.delete('/:id', protect, async (req, res) => {
  try {
    await db.query('DELETE FROM items WHERE id = $1', [req.params.id]);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;