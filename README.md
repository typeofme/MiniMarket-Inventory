# MiniMarket
## https://fp.fela.one Live Preview
A web-based market management system built with Express.js and Tailwind CSS.

## Prerequisites

### Linux (Ubuntu)
```bash
# Install Node.js and npm
sudo apt update
sudo apt install nodejs npm

# Verify installation
node -v
npm -v
```

### ArchLinux
```bash
# Install Node.js and npm
yay -S nvm
nvm install 22

# Verify installation
node -v
npm -v
```

### Windows
1. Download the Node.js installer from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the installation wizard
3. Verify installation by opening Command Prompt or PowerShell:
```bash
node -v
npm -v
```

## Installation

1. Clone the repository or download the source code
2. Navigate to the project directory
```bash
cd /path/to/MiniMarket
```
3. Install dependencies
```bash
npm install
```

4. Initialize Tailwind CSS
```bash
npx tailwindcss init -p
```

### Troubleshooting

If you encounter the following error:
```
npm ERR! could not determine executable to run
```

Run the following commands instead:
```bash
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

## Running the Project

1. Start the Tailwind CSS build process:
```bash
npx tailwindcss -i ./public/css/tailwind.css -o ./public/css/style.css --watch
```

2. In a new terminal, start the server:
```bash
node app.js
```

3. Open your browser and navigate to `http://localhost:3000`
