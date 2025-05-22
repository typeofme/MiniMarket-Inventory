const express = require('express');
const path = require('path');
const app = express();
const productsRoute = require('./routes/products');
const reportRoute = require('./routes/report');
const templateRoute = require('./routes/template');
const dashboardRoute = require('./routes/dashboard');
const assetRoute = require('./routes/asset');
const restockRoute = require('./routes/restock');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use('/components', express.static(path.join(__dirname, 'components'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

app.use('/', dashboardRoute);
app.use('/reports', reportRoute);
app.use('/temp', templateRoute);
app.use('/products', productsRoute);
app.use('/assets', assetRoute);
app.use('/restock', restockRoute);

app.use('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

app.use('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
}
);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
