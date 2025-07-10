# MiniMarket Inventory Management
## Live Preview
<h2>https://minimarket.typeof.me</h2>

## Technology Stack

- **Backend**: Node.js with Express
- **Database**: MySQL with Knex.js query builder
- **Frontend**: HTML, CSS, JavaScript with Tailwind CSS
- **Authentication**: JWT (JSON Web Tokens)

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or bun package manager

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/typeofme/MiniMarket-Inventory
cd MiniMarket-Inventory
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using bun:
```bash
bun install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server configuration
PORT=3000

# Database configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=minimarketdb

NODE_ENV=development
RESEND_API_KEY=KEY
```

### 4. Database Setup

The application includes scripts to set up the database automatically:

```bash
# Create database, tables, and seed initial data
npm run db:init
```

This will:
1. Create the database if it doesn't exist
2. Create all necessary tables
3. Seed the database with initial data (users, categories, products, etc.)

## Running the Application

```bash
npm start
```

The application will be available at `http://localhost:3000` (or the port you specified in the .env file).

## Default Login Credentials

After initializing the database, you can log in with these default credentials:

- **Admin User**:
  - Username: admin
  - Email: admin@minimarket.com
  - Password: admin123

## Database Management Scripts

The application includes several scripts to help manage the database:

```bash
# Initialize database (create tables and seed data)
npm run db:init

# Seed data only
npm run db:seed
```

## Project Structure

```
MiniMarket-Inventory/
├── app.js                 # Main application entry point
├── components/            # UI components
├── config/                # Configuration files
├── controllers/           # Route controllers
├── middleware/            # Express middleware
├── models/                # Database models
├── public/                # Static assets
├── routes/                # API routes
├── scripts/               # Database scripts
│   ├── database/          # Database migrations
│   └── seeders/           # Data seeders
└── views/                 # HTML templates
```

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Ensure MySQL is running on your system
2. Verify the database credentials in your `.env` file
3. Make sure the database exists or has been created
4. Check for any firewall or network restrictions

### Table Creation Failures

If tables fail to create:

```bash
# Run the unified migration script directly
node scripts/database/unifiedMigration.js
```

### Seeding Issues

If you encounter issues with data seeding:

```bash
# Seed users
node scripts/seeders/seedUsers.js

# Seed categories and products
node scripts/seeders/seedData.js

# Seed logs
node scripts/seeders/seedLogs.js

# Seed reports
node scripts/seeders/seedReports.js

# Seed assets
node scripts/seeders/seedAssets.js
```


## Contributors

- [Fikri](https://github.com/Ahmad-Fikr) - Asset & Restock
- [Deksha](https://github.com/Dekhsa) - Report & Support
- [Chris](https://github.com/Chris-adit) - Login & Profile
- [Inra](https://github.com/Fuuuuuuuu04) - Supplier & Logs
