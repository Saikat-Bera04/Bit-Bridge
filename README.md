# 🌉 Bit Bridge - Algorand Remittance DApp

A modern, secure, and user-friendly decentralized application for cross-border remittances built on the Algorand blockchain. Bit Bridge enables fast, low-cost international money transfers with real-time transaction tracking and analytics.

## ✨ Features

### 🔐 Wallet Integration
- **Pera Wallet Support**: Seamless integration with Pera Wallet for mobile and desktop
- **Multi-Network Support**: TestNet, MainNet, and BetaNet compatibility
- **Secure Authentication**: JWT-based authentication with wallet connection

### 💸 Transaction Management
- **Real-time Transfers**: Instant ALGO transfers on Algorand network
- **Live Transaction History**: Real-time updates with polling and WebSocket support
- **Advanced Filtering**: Search and filter transactions by amount, date, status, and type
- **Transaction Analytics**: Comprehensive spending analysis and insights

### 📊 Analytics Dashboard
- **Live Analytics**: Real-time transaction analytics with automatic updates
- **Spending Insights**: Monthly spending trends and patterns
- **Portfolio Tracking**: Balance monitoring and transaction categorization
- **Visual Charts**: Interactive charts for transaction data visualization

### 🎨 Modern UI/UX
- **Glass Morphism Design**: Beautiful, modern interface with glass card effects
- **Responsive Layout**: Mobile-first design that works on all devices
- **Dark Theme**: Elegant dark theme with gradient backgrounds
- **Smooth Animations**: Framer Motion animations for enhanced user experience

## 🏗️ Architecture

### Frontend (`/client`)
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Query** for data fetching and caching
- **Shadcn/ui** components for consistent UI

### Backend (`/server`)
- **Node.js** with Express
- **MongoDB** for data persistence
- **JWT Authentication** for secure API access
- **RESTful API** design
- **Real-time updates** support

### Smart Contracts (`/smart_contracts`)
- **TEALScript** for Algorand smart contracts
- **Algorand SDK** integration
- **Contract deployment** scripts
- **Testing utilities**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Saikat-Bera04/Bit-Bridge.git
cd Bit-Bridge
```

2. **Install dependencies**
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install

# Install smart contract dependencies
cd ../smart_contracts
npm install
```

3. **Environment Setup**

Create `.env` files in each directory:

**Client (`.env`)**
```env
VITE_API_URL=http://localhost:5001
VITE_ALGORAND_NETWORK=testnet
```

**Server (`.env`)**
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/bitbridge
JWT_SECRET=your_jwt_secret_here
ALGORAND_NETWORK=testnet
```

4. **Start the application**

```bash
# Terminal 1: Start MongoDB (if local)
mongod

# Terminal 2: Start the backend server
cd server
npm run dev

# Terminal 3: Start the frontend
cd client
npm run dev
```

5. **Access the application**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5001`

## 📱 Usage

### Getting Started
1. **Connect Wallet**: Click "Connect Wallet" and scan QR code with Pera Wallet
2. **Fund Account**: Ensure your wallet has ALGO for transactions and fees
3. **Send Money**: Navigate to Send page, enter recipient and amount
4. **Track Transactions**: View real-time transaction history and analytics

### Key Pages
- **Dashboard**: Overview of account balance and recent activity
- **Send**: Create and send ALGO transactions
- **History**: View detailed transaction history with filtering
- **Analysis**: Comprehensive spending analytics and insights
- **Profile**: Wallet management and account settings

## 🔧 Development

### Project Structure
```
bit-bridge/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── config/        # Configuration files
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── server/                # Node.js backend
│   ├── routes/           # API route handlers
│   ├── models/           # Database models
│   ├── middleware/       # Express middleware
│   └── scripts/          # Utility scripts
└── smart_contracts/      # Algorand smart contracts
    ├── contracts/        # TEALScript contracts
    └── scripts/          # Deployment scripts
```

### Key Technologies
- **Algorand SDK**: Blockchain interaction and transaction management
- **Pera Wallet Connect**: Wallet integration and signing
- **React Query**: Data fetching, caching, and synchronization
- **Framer Motion**: Smooth animations and transitions
- **Tailwind CSS**: Utility-first CSS framework

### Development Scripts

**Client**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

**Server**
```bash
npm run dev          # Start with nodemon
npm start            # Start production server
npm run test         # Run tests
```

## 🌐 Network Configuration

The application supports multiple Algorand networks:

- **TestNet** (Default): For development and testing
- **MainNet**: For production use
- **BetaNet**: For experimental features

Network configuration is centralized in `/client/src/config/network.ts`.

## 🔒 Security Features

- **Wallet-based Authentication**: No passwords, only wallet signatures
- **JWT Tokens**: Secure API authentication
- **Input Validation**: Comprehensive validation on client and server
- **Rate Limiting**: API rate limiting for security
- **HTTPS Ready**: Production-ready security configurations

## 🚀 Deployment

### Frontend Deployment
```bash
cd client
npm run build
# Deploy dist/ folder to your hosting provider
```

### Backend Deployment
```bash
cd server
npm install --production
npm start
# Configure environment variables for production
```

### Environment Variables
Ensure all production environment variables are properly configured:
- Database connection strings
- JWT secrets
- API endpoints
- Network configurations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Community**: Join our Discord server for community support

## 🙏 Acknowledgments

- **Algorand Foundation** for the robust blockchain infrastructure
- **Pera Wallet** team for excellent wallet integration
- **React** and **Node.js** communities for amazing tools
- **Open Source** contributors who made this project possible

---

**Built with ❤️ for the Algorand ecosystem**
