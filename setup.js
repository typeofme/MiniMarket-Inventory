/**
 * MiniMarket Inventory Setup Script
 * 
 * This interactive script helps users set up and manage the MiniMarket application.
 * It provides options for database initialization, server management, and other tasks.
 * 
 * Run with: node setup.js
 */

const readline = require('readline');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Helper function to clear the terminal screen
function clearScreen() {
  process.stdout.write('\x1Bc');
}

// Helper function to display a header
function displayHeader() {
  clearScreen();
  console.log(`${colors.cyan}${colors.bright}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}║                                                        ║${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}║             MINIMARKET INVENTORY SETUP                 ║${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}║                                                        ║${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}╚════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
}

// Helper function to display the main menu
function displayMainMenu() {
  displayHeader();
  console.log(`${colors.green}Please select an option:${colors.reset}`);
  console.log('');
  console.log(`${colors.yellow}[1]${colors.reset} Initialize Database (Create tables and seed data)`);
  console.log(`${colors.yellow}[2]${colors.reset} Start Development Server`);
  console.log(`${colors.yellow}[3]${colors.reset} Start Production Server`);
  console.log(`${colors.yellow}[4]${colors.reset} Advanced Database Options`);
  console.log(`${colors.yellow}[5]${colors.reset} Check Environment Setup`);
  console.log(`${colors.yellow}[6]${colors.reset} Exit`);
  console.log('');
  rl.question(`${colors.green}Enter your choice (1-6): ${colors.reset}`, handleMainMenuChoice);
}

// Helper function to display the advanced database menu
function displayDatabaseMenu() {
  displayHeader();
  console.log(`${colors.green}Advanced Database Options:${colors.reset}`);
  console.log('');
  console.log(`${colors.yellow}[1]${colors.reset} Create Database Only`);
  console.log(`${colors.yellow}[2]${colors.reset} Create Tables Only`);
  console.log(`${colors.yellow}[3]${colors.reset} Seed Users`);
  console.log(`${colors.yellow}[4]${colors.reset} Seed Categories and Products`);
  console.log(`${colors.yellow}[5]${colors.reset} Seed Logs`);
  console.log(`${colors.yellow}[6]${colors.reset} Seed Reports`);
  console.log(`${colors.yellow}[7]${colors.reset} Seed Assets`);
  console.log(`${colors.yellow}[8]${colors.reset} Back to Main Menu`);
  console.log('');
  rl.question(`${colors.green}Enter your choice (1-8): ${colors.reset}`, handleDatabaseMenuChoice);
}

// Execute a command and return a promise
function executeCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n${colors.cyan}Executing: ${command} ${args.join(' ')}${colors.reset}\n`);
    
    const childProcess = spawn(command, args, { stdio: 'inherit' });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });
    
    childProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// Check if .env file exists and contains required database configuration
function checkEnvironmentSetup() {
  displayHeader();
  console.log(`${colors.green}Checking environment setup...${colors.reset}\n`);
  
  // Check if .env file exists
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.log(`${colors.red}Error: .env file not found!${colors.reset}`);
    console.log(`${colors.yellow}Creating a template .env file...${colors.reset}`);
    
    const envTemplate = `# Server configuration
PORT=3000

# Database configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=minimarketdb

NODE_ENV=development
`;
    
    fs.writeFileSync(envPath, envTemplate);
    console.log(`${colors.green}Template .env file created. Please edit it with your database credentials.${colors.reset}`);
    return false;
  }
  
  // Check if required environment variables are set
  const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'RESEND_API_KEY'];
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.log(`${colors.red}Error: Missing required environment variables: ${missingVars.join(', ')}${colors.reset}`);
    console.log(`${colors.yellow}Please edit your .env file and add these variables.${colors.reset}`);
    return false;
  }
  
  console.log(`${colors.green}✓ Environment setup looks good!${colors.reset}`);
  console.log(`\nDatabase Configuration:`);
  console.log(`  Host: ${process.env.DB_HOST}`);
  console.log(`  Port: ${process.env.DB_PORT || '3306'}`);
  console.log(`  User: ${process.env.DB_USER}`);
  console.log(`  Database: ${process.env.DB_NAME}`);
  console.log(`  Resend API Key: ${process.env.RESEND_API_KEY}`);
  
  return true;
}

// Handle main menu choices
async function handleMainMenuChoice(choice) {
  try {
    switch (choice) {
      case '1': // Initialize Database
        await initializeDatabase();
        break;
      case '2': // Start Development Server
        await startDevelopmentServer();
        break;
      case '3': // Start Production Server
        await startProductionServer();
        break;
      case '4': // Advanced Database Options
        displayDatabaseMenu();
        return; // Don't prompt for main menu again yet
      case '5': // Check Environment Setup
        checkEnvironmentSetup();
        break;
      case '6': // Exit
        console.log(`\n${colors.green}Thank you for using MiniMarket Inventory Setup!${colors.reset}`);
        rl.close();
        return; // Exit the program
      default:
        console.log(`\n${colors.red}Invalid choice. Please try again.${colors.reset}`);
    }
  } catch (error) {
    console.error(`\n${colors.red}Error: ${error.message}${colors.reset}`);
  }
  
  // Return to main menu after task completes (except for exit)
  console.log('\nPress Enter to continue...');
  rl.question('', () => {
    displayMainMenu();
  });
}

// Handle database menu choices
async function handleDatabaseMenuChoice(choice) {
  try {
    switch (choice) {
      case '1': // Create Database Only
        await executeCommand('node', ['scripts/database/create-database.js']);
        break;
      case '2': // Create Tables Only
        await executeCommand('node', ['scripts/database/unified-migration.js']);
        break;
      case '3': // Seed Users
        await executeCommand('node', ['scripts/seeders/seedUsers.js']);
        break;
      case '4': // Seed Categories and Products
        await executeCommand('node', ['scripts/seeders/seedData.js']);
        break;
      case '5': // Seed Logs
        await executeCommand('node', ['scripts/seeders/seedLogs.js']);
        break;
      case '6': // Seed Reports
        await executeCommand('node', ['scripts/seeders/seedReports.js']);
        break;
      case '7': // Seed Assets
        await executeCommand('node', ['scripts/seeders/seedAssets.js']);
        break;
      case '8': // Back to Main Menu
        displayMainMenu();
        return; // Don't prompt for database menu again
      default:
        console.log(`\n${colors.red}Invalid choice. Please try again.${colors.reset}`);
    }
  } catch (error) {
    console.error(`\n${colors.red}Error: ${error.message}${colors.reset}`);
  }
  
  // Return to database menu after task completes (except for back to main menu)
  console.log('\nPress Enter to continue...');
  rl.question('', () => {
    displayDatabaseMenu();
  });
}

// Initialize database (create tables and seed data)
async function initializeDatabase() {
    if (!checkEnvironmentSetup()) {
      console.log(`\n${colors.yellow}Please fix the environment setup before initializing the database.${colors.reset}`);
      return;
    }
  
    console.log(`\n${colors.green}Initializing database...${colors.reset}`);
    await executeCommand('node', ['scripts/initDb.js']);
    console.log(`\n${colors.green}Database initialization completed successfully!${colors.reset}`);
  }
  

// Start development server with nodemon
async function startDevelopmentServer() {
  console.log(`\n${colors.green}Starting development server...${colors.reset}`);
  console.log(`\n${colors.yellow}Press Ctrl+C to stop the server.${colors.reset}\n`);
  
  const serverProcess = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
  
  // This will keep the server running until the user presses Ctrl+C
  await new Promise((resolve) => {
    serverProcess.on('close', resolve);
  });
}

// Start production server
async function startProductionServer() {
  console.log(`\n${colors.green}Starting production server...${colors.reset}`);
  console.log(`\n${colors.yellow}Press Ctrl+C to stop the server.${colors.reset}\n`);
  
  const serverProcess = spawn('npm', ['start'], { stdio: 'inherit' });
  
  // This will keep the server running until the user presses Ctrl+C
  await new Promise((resolve) => {
    serverProcess.on('close', resolve);
  });
}

// Handle exit
rl.on('close', () => {
  console.log(`\n${colors.green}Goodbye!${colors.reset}`);
  process.exit(0);
});

// Start the setup script
displayMainMenu(); 