const express = require('express');
const router = express.Router();
const db = require('../db');
const protect = require('../middleware/auth');

// GET all accessories with supplier and party names
router.get('/', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, 
        s.name as supplier_name,
        p.name as for_party_name
       FROM accessories a
       LEFT JOIN parties s ON a.supplier_id = s.id
       LEFT JOIN parties p ON a.for_party_id = p.id
       ORDER BY a.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET accessories by party (owned by party)
router.get('/party/:party_id', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*,
        s.name as supplier_name,
        p.name as for_party_name
       FROM accessories a
       LEFT JOIN parties s ON a.supplier_id = s.id
       LEFT JOIN parties p ON a.for_party_id = p.id
       WHERE a.party_id_owner = $1 OR a.for_party_id = $1
       ORDER BY a.created_at DESC`,
      [req.params.party_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET accessories by supplier
router.get('/supplier/:supplier_id', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*,
        s.name as supplier_name,
        p.name as for_party_name
       FROM accessories a
       LEFT JOIN parties s ON a.supplier_id = s.id
       LEFT JOIN parties p ON a.for_party_id = p.id
       WHERE a.supplier_id = $1
       ORDER BY a.created_at DESC`,
      [req.params.supplier_id]
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

// POST — add accessory
router.post('/', protect, async (req, res) => {
  const {
    name, category, quantity, unit, unit_price,
    party_id_owner, notes, supplier_id,
    for_party_id, accessory_type, purchase_date
  } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO accessories 
        (name, category, quantity, unit, unit_price, party_id_owner, notes,
         supplier_id, for_party_id, accessory_type, purchase_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, category, quantity, unit, unit_price,
       party_id_owner || for_party_id || null, notes,
       supplier_id || null, for_party_id || null,
       accessory_type || 'General', purchase_date || new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT — update accessory
router.put('/:id', protect, async (req, res) => {
  const { name, category, quantity, unit, unit_price, notes, supplier_id, for_party_id, accessory_type, purchase_date } = req.body;
  try {
    const forParty = accessory_type === 'For Party' ? for_party_id || null : null;
    const result = await db.query(
      `UPDATE accessories SET name=$1, category=$2, quantity=$3, unit=$4,
       unit_price=$5, notes=$6, supplier_id=$7, for_party_id=$8,
       party_id_owner=$9, accessory_type=$10, purchase_date=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [name, category, quantity, unit, unit_price, notes,
       supplier_id || null, forParty, forParty,
       accessory_type || 'General', purchase_date || null, req.params.id]
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