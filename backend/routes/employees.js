const express = require('express');
const router = express.Router();
const db = require('../db');
const protect = require('../middleware/auth');

// GET all employees
router.get('/', protect, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM employees ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single employee by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM employees WHERE id = $1', [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST — add a new employee
router.post('/', protect, async (req, res) => {
  const {
    full_name, role, phone, cnic, address, joining_date, salary,
    employee_type, rate_per_piece, rate_per_day, rate_per_order
  } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO employees 
        (full_name, role, phone, cnic, address, joining_date, salary,
         employee_type, rate_per_piece, rate_per_day, rate_per_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [full_name, role, phone, cnic, address, joining_date, salary || 0,
       employee_type || 'Fixed',
       rate_per_piece || 0, rate_per_day || 0, rate_per_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT — update an existing employee
router.put('/:id', protect, async (req, res) => {
  const {
    full_name, role, phone, cnic, address, joining_date, salary, status,
    employee_type, rate_per_piece, rate_per_day, rate_per_order
  } = req.body;
  try {
    const result = await db.query(
      `UPDATE employees SET 
        full_name=$1, role=$2, phone=$3, cnic=$4,
        address=$5, joining_date=$6, salary=$7, status=$8,
        employee_type=$9, rate_per_piece=$10, rate_per_day=$11,
        rate_per_order=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [full_name, role, phone, cnic, address, joining_date, salary || 0,
       status || 'Active', employee_type || 'Fixed',
       rate_per_piece || 0, rate_per_day || 0, rate_per_order || 0,
       req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE
router.delete('/:id', protect, async (req, res) => {
  try {
    await db.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;