const express = require('express');
const router = express.Router();
const db = require('../db');
const protect = require('../middleware/auth');

// GET all payrolls — joins with employees table to show employee name
router.get('/', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, e.full_name, e.role 
       FROM payrolls p
       JOIN employees e ON p.employee_id = e.id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all payrolls for a specific employee
router.get('/employee/:employee_id', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, e.full_name, e.role
       FROM payrolls p
       JOIN employees e ON p.employee_id = e.id
       WHERE p.employee_id = $1
       ORDER BY p.created_at DESC`,
      [req.params.employee_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single payroll by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, e.full_name, e.role
       FROM payrolls p
       JOIN employees e ON p.employee_id = e.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Payroll not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST — add a new payroll entry for an employee
router.post('/', protect, async (req, res) => {
  const { employee_id, month, basic_salary, bonus, overtime, deductions, paid_on, status, notes } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO payrolls 
       (employee_id, month, basic_salary, bonus, overtime, deductions, paid_on, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [employee_id, month, basic_salary, bonus, overtime, deductions, paid_on, status, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT — update a payroll entry
router.put('/:id', protect, async (req, res) => {
  const { employee_id, month, basic_salary, bonus, overtime, deductions, paid_on, status, notes } = req.body;
  try {
    const result = await db.query(
      `UPDATE payrolls SET employee_id=$1, month=$2, basic_salary=$3, bonus=$4,
       overtime=$5, deductions=$6, paid_on=$7, status=$8, notes=$9
       WHERE id=$10 RETURNING *`,
      [employee_id, month, basic_salary, bonus, overtime, deductions, paid_on, status, notes, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Payroll not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE — remove a payroll entry
router.delete('/:id', protect, async (req, res) => {
  try {
    await db.query('DELETE FROM payrolls WHERE id = $1', [req.params.id]);
    res.json({ message: 'Payroll deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;