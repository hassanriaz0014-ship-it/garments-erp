const express = require('express');
const router = express.Router();
const db = require('../db');
const protect = require('../middleware/auth');

// GET all items with party name
router.get('/', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT i.*, p.name as party_name
       FROM items i
       LEFT JOIN parties p ON i.party_id = p.id
       ORDER BY i.created_at DESC`
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
      `SELECT i.*, p.name as party_name
       FROM items i
       LEFT JOIN parties p ON i.party_id = p.id
       WHERE i.party_id = $1
       ORDER BY i.created_at DESC`,
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
      `SELECT i.*, p.name as party_name
       FROM items i
       LEFT JOIN parties p ON i.party_id = p.id
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST — add item
router.post('/', protect, async (req, res) => {
  const {
    style_no, description, party_id,
    colors, sizes, costing_sheet,
    profit_margin, selling_price, total_cost,
    labour_price, image_url, fabric
  } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO items
        (style_no, description, party_id, colors, sizes,
         costing_sheet, profit_margin, selling_price, total_cost,
         labour_price, image_url, fabric)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        style_no, description, party_id,
        colors || [], sizes || [],
        JSON.stringify(costing_sheet || []),
        profit_margin || 0, selling_price || 0, total_cost || 0,
        labour_price || 0, image_url || '', fabric || ''
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  const {
    style_no, description, party_id,
    colors, sizes, costing_sheet,
    profit_margin, selling_price, total_cost,
    labour_price, image_url, fabric
  } = req.body;
  try {
    console.log('PUT items body:', req.body);  // ADD THIS
    const result = await db.query(
      `UPDATE items SET
        style_no=$1, description=$2, party_id=$3, colors=$4, sizes=$5,
        costing_sheet=$6, profit_margin=$7, selling_price=$8,
        total_cost=$9, labour_price=$10, image_url=$11,
        fabric=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [
        style_no, description, party_id || null,
        colors || [], sizes || [],
        JSON.stringify(costing_sheet || []),
        profit_margin || 0, selling_price || 0, total_cost || 0,
        labour_price || 0, image_url || '', fabric || '',
        req.params.id
      ]
    );
    console.log('PUT items result:', result.rows);  // ADD THIS
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.log('PUT items error:', err.message);  // ADD THIS
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