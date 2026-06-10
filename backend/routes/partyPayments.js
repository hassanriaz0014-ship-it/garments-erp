const express = require('express');
const router = express.Router();
const db = require('../db');
const protect = require('../middleware/auth');

// GET all payments for a party
router.get('/:party_id', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT pp.*, pa.bank_name, pa.account_no 
       FROM party_payments pp
       LEFT JOIN party_accounts pa ON pp.account_id = pa.id
       WHERE pp.party_id = $1 
       ORDER BY pp.date ASC, pp.created_at ASC`,
      [req.params.party_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST — add a payment and auto-deduct from oldest unpaid invoices
router.post('/', protect, async (req, res) => {
  const { party_id, account_id, account_name, amount, date, notes } = req.body;
  try {
    // Save the payment
    const result = await db.query(
      `INSERT INTO party_payments (party_id, account_id, account_name, amount, date, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [party_id, account_id, account_name, amount, date, notes]
    );

    // Auto-deduct from oldest unpaid invoices
    let remaining = parseFloat(amount);

    // Get all unpaid/partial invoices for this party sorted by date (oldest first)
    const unpaidInvoices = await db.query(
      `SELECT * FROM invoices 
       WHERE party_id = $1 AND status != 'Paid' 
       ORDER BY issue_date ASC, created_at ASC`,
      [party_id]
    );

    for (const inv of unpaidInvoices.rows) {
      if (remaining <= 0) break;

      const invRemaining = parseFloat(inv.total) - parseFloat(inv.amount_paid || 0);
      if (invRemaining <= 0) continue;

      let newAmountPaid;
      let newRemaining;
      let newStatus;

      if (remaining >= invRemaining) {
        // This payment fully covers this invoice
        newAmountPaid = parseFloat(inv.amount_paid || 0) + invRemaining;
        newRemaining = 0;
        newStatus = 'Paid';
        remaining -= invRemaining;
      } else {
        // Partial payment
        newAmountPaid = parseFloat(inv.amount_paid || 0) + remaining;
        newRemaining = invRemaining - remaining;
        newStatus = 'Partial';
        remaining = 0;
      }

      await db.query(
        `UPDATE invoices SET 
          amount_paid = $1, remaining = $2, status = $3, updated_at = NOW()
         WHERE id = $4`,
        [newAmountPaid, newRemaining, newStatus, inv.id]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE — remove a payment and recalculate invoices
router.delete('/:id', protect, async (req, res) => {
  try {
    // Get the payment before deleting
    const paymentRes = await db.query(
      'SELECT * FROM party_payments WHERE id = $1', [req.params.id]
    );
    if (paymentRes.rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    const payment = paymentRes.rows[0];
    const party_id = payment.party_id;

    // Delete the payment
    await db.query('DELETE FROM party_payments WHERE id = $1', [req.params.id]);

    // Reset all invoices for this party
    await db.query(
      `UPDATE invoices SET amount_paid = 0, remaining = total, status = 'Pending' 
       WHERE party_id = $1`,
      [party_id]
    );

    // Get remaining payments sorted by date oldest first
    const remainingPayments = await db.query(
      `SELECT * FROM party_payments WHERE party_id = $1 ORDER BY date ASC, created_at ASC`,
      [party_id]
    );

    // Reapply all remaining payments to invoices
    for (const pay of remainingPayments.rows) {
      let remaining = parseFloat(pay.amount);

      const unpaidInvoices = await db.query(
        `SELECT * FROM invoices 
         WHERE party_id = $1 AND status != 'Paid' 
         ORDER BY issue_date ASC, created_at ASC`,
        [party_id]
      );

      for (const inv of unpaidInvoices.rows) {
        if (remaining <= 0) break;

        const invRemaining = parseFloat(inv.total) - parseFloat(inv.amount_paid || 0);
        if (invRemaining <= 0) continue;

        let newAmountPaid;
        let newRemaining;
        let newStatus;

        if (remaining >= invRemaining) {
          newAmountPaid = parseFloat(inv.amount_paid || 0) + invRemaining;
          newRemaining = 0;
          newStatus = 'Paid';
          remaining -= invRemaining;
        } else {
          newAmountPaid = parseFloat(inv.amount_paid || 0) + remaining;
          newRemaining = invRemaining - remaining;
          newStatus = 'Partial';
          remaining = 0;
        }

        await db.query(
          `UPDATE invoices SET 
            amount_paid = $1, remaining = $2, status = $3, updated_at = NOW()
           WHERE id = $4`,
          [newAmountPaid, newRemaining, newStatus, inv.id]
        );
      }
    }

    res.json({ message: 'Payment deleted and invoices recalculated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;