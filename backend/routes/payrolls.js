const express = require('express');
const router = express.Router();
const db = require('../db');
const protect = require('../middleware/auth');

// GET all payrolls
router.get('/', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, e.full_name as employee_name, e.role,
        e.employee_type, e.rate_per_piece, e.rate_per_day, e.rate_per_order
       FROM payrolls p
       JOIN employees e ON p.employee_id = e.id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET payrolls for specific employee
router.get('/employee/:employee_id', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, e.full_name as employee_name, e.role,
        e.employee_type, e.rate_per_piece, e.rate_per_day, e.rate_per_order
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

// GET single payroll
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, e.full_name as employee_name, e.role,
        e.employee_type, e.rate_per_piece, e.rate_per_day, e.rate_per_order
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

// POST — add payroll
router.post('/', protect, async (req, res) => {
  const {
    employee_id, employee_name, month, year, basic_salary,
    bonus, deductions, advance, notes, status,
    payroll_type, week_start, week_end,
    pieces_count, days_count, orders_count,
    net_pay, total_pay, payroll_items
  } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO payrolls
        (employee_id, employee_name, month, year, basic_salary,
         bonus, deductions, advance, notes, status,
         payroll_type, week_start, week_end,
         pieces_count, days_count, orders_count,
         net_pay, total_pay, payroll_items)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING *`,
      [
        employee_id, employee_name, month || null, year || null,
        basic_salary || 0, bonus || 0, deductions || 0, advance || 0,
        notes, status || 'Paid',
        payroll_type || 'Monthly',
        week_start ? week_start + 'T12:00:00' : null, week_end ? week_end + 'T12:00:00' : null,
        pieces_count || 0, days_count || 0, orders_count || 0,
        net_pay || total_pay || 0, net_pay || total_pay || 0,
        JSON.stringify(payroll_items || [])
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT — update payroll
router.put('/:id', protect, async (req, res) => {
  const {
    employee_id, employee_name, month, year, basic_salary,
    bonus, deductions, advance, notes, status,
    payroll_type, week_start, week_end,
    pieces_count, days_count, orders_count,
    net_pay, total_pay, payroll_items
  } = req.body;
  try {
    const result = await db.query(
      `UPDATE payrolls SET
        employee_id=$1, employee_name=$2, month=$3, year=$4,
        basic_salary=$5, bonus=$6, deductions=$7, advance=$8,
        notes=$9, status=$10,
        payroll_type=$11, week_start=$12, week_end=$13,
        pieces_count=$14, days_count=$15, orders_count=$16,
        net_pay=$17, total_pay=$18, payroll_items=$19
       WHERE id=$20 RETURNING *`,
      [
        employee_id, employee_name, month || null, year || null,
        basic_salary || 0, bonus || 0, deductions || 0, advance || 0,
        notes, status || 'Paid',
        payroll_type || 'Monthly',
        week_start ? week_start + 'T12:00:00' : null, week_end ? week_end + 'T12:00:00' : null,
        pieces_count || 0, days_count || 0, orders_count || 0,
        net_pay || total_pay || 0, net_pay || total_pay || 0,
        JSON.stringify(payroll_items || []),
        req.params.id
      ]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Payroll not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE
router.delete('/:id', protect, async (req, res) => {
  try {
    await db.query('DELETE FROM payrolls WHERE id = $1', [req.params.id]);
    res.json({ message: 'Payroll deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;