const express = require('express');
const router = express.Router();
const db = require('../db');
const protect = require('../middleware/auth');

// GET all invoices — joins with parties to show party name
router.get('/', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT i.*, p.name as party_name, p.type as party_type
       FROM invoices i
       LEFT JOIN parties p ON i.party_id = p.id
       ORDER BY i.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single invoice with its line items
router.get('/:id', protect, async (req, res) => {
  try {
    const invoice = await db.query(
      `SELECT i.*, p.name as party_name, p.type as party_type
       FROM invoices i
       LEFT JOIN parties p ON i.party_id = p.id
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (invoice.rows.length === 0)
      return res.status(404).json({ message: 'Invoice not found' });

    // Also fetch the line items for this invoice
    const items = await db.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1',
      [req.params.id]
    );

    // Send invoice details together with its line items
    res.json({ ...invoice.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST — create a new invoice with line items
router.post('/', protect, async (req, res) => {
  const {
    invoice_no, type, party_id, issue_date, due_date,
    subtotal, discount, tax, total, notes, items,
    advance, freight_charges, amount_paid, remaining,
    status, shipment_type
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO invoices 
       (invoice_no, type, party_id, issue_date, due_date, subtotal, discount, 
        tax, total, notes, advance, freight_charges, amount_paid, remaining, 
        status, shipment_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
       RETURNING *`,
      [invoice_no, type, party_id, issue_date, due_date, subtotal, discount || 0,
       tax || 0, total, notes, advance || 0, freight_charges || 0,
       amount_paid || 0, remaining || 0, status || 'Pending', shipment_type || 'Air']
    );

    const invoice = result.rows[0];

    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(
          `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [invoice.id, item.description, item.quantity, item.unit_price]
        );
      }
    }

    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT — update invoice details
router.put('/:id', protect, async (req, res) => {
  const {
    invoice_no, type, party_id, issue_date, due_date,
    subtotal, discount, tax, total, paid, status, notes,
    amount_paid, remaining, advance, freight_charges, shipment_type
  } = req.body;
  try {
    const result = await db.query(
      `UPDATE invoices SET 
        invoice_no=$1, type=$2, party_id=$3, issue_date=$4,
        due_date=$5, subtotal=$6, discount=$7, tax=$8, total=$9, 
        paid=$10, status=$11, notes=$12, updated_at=NOW(),
        amount_paid=$13, remaining=$14, advance=$15, 
        freight_charges=$16, shipment_type=$17
       WHERE id=$18 RETURNING *`,
      [invoice_no, type, party_id, issue_date, due_date,
       subtotal, discount, tax, total, paid, status, notes,
       amount_paid, remaining, advance, freight_charges, shipment_type,
       req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Invoice not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// DELETE — remove an invoice and its line items
// Line items are deleted automatically because of CASCADE in the schema
router.delete('/:id', protect, async (req, res) => {
  try {
    await db.query('DELETE FROM invoices WHERE id = $1', [req.params.id]);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;