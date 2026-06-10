// Load environment variables from .env file
require('dotenv').config({ path: __dirname + '/.env' });

// Import express to create the server
const express = require('express');

// Import cors to allow app to communicate with server
const cors = require('cors');

// Import database connection
const db = require('./db');

// Import all route files
const itemsRoutes = require('./routes/items');
const authRoutes = require('./routes/auth');
const partiesRoutes = require('./routes/parties');
const accessoriesRoutes = require('./routes/accessories');
const employeesRoutes = require('./routes/employees');
const payrollsRoutes = require('./routes/payrolls');
const invoicesRoutes = require('./routes/invoices');
const categoriesRoutes = require('./routes/categories');
const partyAccountsRoutes = require('./routes/partyAccounts');
const partyPaymentsRoutes = require('./routes/partyPayments');

// Create the express app
const app = express();

// Accept JSON data in requests
app.use(express.json());

// Enable cors
app.use(cors());

// Register all routes with their base paths
app.use('/api/items', itemsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/parties', partiesRoutes);
app.use('/api/accessories', accessoriesRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/payrolls', payrollsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/party-accounts', partyAccountsRoutes);
app.use('/api/party-payments', partyPaymentsRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Garments ERP server is running!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});