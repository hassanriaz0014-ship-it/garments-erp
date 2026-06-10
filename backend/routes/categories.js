const express = require('express');
const router = express.Router();
const db = require('../db');
const protect = require('../middleware/auth');

// GET all categories
router.get('/', protect, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST — add a new custom category
router.post('/', protect, async (req, res) => {
  const { name } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    // If category already exists return error
    res.status(400).json({ message: 'Category already exists' });
  }
});

// DELETE — remove a custom category
router.delete('/:id',protect, async (req, res) => {
  try {
    await db.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;