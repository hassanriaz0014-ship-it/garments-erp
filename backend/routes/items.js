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
    labour_price, image_url
  } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO items
        (style_no, description, party_id, colors, sizes,
         costing_sheet, profit_margin, selling_price, total_cost,
         labour_price, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        style_no, description, party_id,
        colors || [], sizes || [],
        JSON.stringify(costing_sheet || []),
        profit_margin || 0, selling_price || 0, total_cost || 0,
        labour_price || 0, image_url || ''
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT — update item
router.put('/:id', protect, async (req, res) => {
  const {
    style_no, description,
    colors, sizes, costing_sheet,
    profit_margin, selling_price, total_cost,
    labour_price, image_url
  } = req.body;
  try {
    const result = await db.query(
      `UPDATE items SET
        style_no=$1, description=$2, colors=$3, sizes=$4,
        costing_sheet=$5, profit_margin=$6, selling_price=$7,
        total_cost=$8, labour_price=$9, image_url=$10,
        updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [
        style_no, description,
        colors || [], sizes || [],
        JSON.stringify(costing_sheet || []),
        profit_margin || 0, selling_price || 0, total_cost || 0,
        labour_price || 0, image_url || '',
        req.params.id
      ]
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