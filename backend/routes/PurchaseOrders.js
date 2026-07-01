const express = require('express');
const router = express.Router();
const db = require('../db');
const protect = require('../middleware/auth');

// GET all POs with party name
router.get('/', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT po.*, p.name as party_name
       FROM purchase_orders po
       LEFT JOIN parties p ON po.party_id = p.id
       ORDER BY po.po_date DESC, po.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET POs by party
router.get('/party/:party_id', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT po.*, p.name as party_name
       FROM purchase_orders po
       LEFT JOIN parties p ON po.party_id = p.id
       WHERE po.party_id = $1
       ORDER BY po.po_date DESC, po.created_at DESC`,
      [req.params.party_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single PO with items
router.get('/:id', protect, async (req, res) => {
  try {
    const poResult = await db.query(
      `SELECT po.*, p.name as party_name
       FROM purchase_orders po
       LEFT JOIN parties p ON po.party_id = p.id
       WHERE po.id = $1`,
      [req.params.id]
    );
    if (poResult.rows.length === 0)
      return res.status(404).json({ message: 'PO not found' });
    const itemsResult = await db.query(
      'SELECT * FROM po_items WHERE po_id = $1 ORDER BY id ASC',
      [req.params.id]
    );
    res.json({ ...poResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST — create PO
router.post('/', protect, async (req, res) => {
  const {
    po_number, po_date, party_id, article_name,
    fabric_details, status, notes, items
  } = req.body;
  try {
    const totalPieces = items ? items.reduce((sum, item) => sum + (item.total_pieces || 0), 0) : 0;
    const result = await db.query(
      `INSERT INTO purchase_orders
        (po_number, po_date, party_id, article_name, fabric_details, status, notes, total_pieces)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [po_number, po_date, party_id, article_name, fabric_details,
       status || 'Pending', notes, totalPieces]
    );
    const po = result.rows[0];
    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(
          `INSERT INTO po_items (po_id, style_no, description, color, sizes, total_pieces, cut_sizes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [po.id, item.style_no, item.description, item.color,
           JSON.stringify(item.sizes || {}), item.total_pieces || 0,
           JSON.stringify(item.cut_sizes || {})]
        );
      }
    }
    res.status(201).json(po);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT — update PO
router.put('/:id', protect, async (req, res) => {
  const {
    po_number, po_date, party_id, article_name,
    fabric_details, status, notes, items
  } = req.body;
  try {
    const totalPieces = items ? items.reduce((sum, item) => sum + (item.total_pieces || 0), 0) : 0;
    const result = await db.query(
      `UPDATE purchase_orders SET
        po_number=$1, po_date=$2, party_id=$3, article_name=$4,
        fabric_details=$5, status=$6, notes=$7, total_pieces=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [po_number, po_date, party_id, article_name, fabric_details,
       status, notes, totalPieces, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'PO not found' });
    // Delete old items and re-insert
    await db.query('DELETE FROM po_items WHERE po_id = $1', [req.params.id]);
    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(
          `INSERT INTO po_items (po_id, style_no, description, color, sizes, total_pieces, cut_sizes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [req.params.id, item.style_no, item.description, item.color,
           JSON.stringify(item.sizes || {}), item.total_pieces || 0,
           JSON.stringify(item.cut_sizes || {})]
        );
      }
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE
router.delete('/:id', protect, async (req, res) => {
  try {
    await db.query('DELETE FROM purchase_orders WHERE id = $1', [req.params.id]);
    res.json({ message: 'PO deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;