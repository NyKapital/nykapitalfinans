# NyKapital Finans - Account Management MVP

A modern, user-friendly business account management platform for Danish merchants, inspired by leading fintech apps like Revolut, Wise, Monzo, and NuBank.

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)

## Overview

NyKapital Finans provides Danish merchants with a comprehensive account management solution featuring:

- **Multi-Account Management** - Manage multiple business accounts in different currencies (DKK, EUR, USD)
- **Transaction Tracking** - Real-time transaction monitoring and history
- **Payment Processing** - Send payments to suppliers and partners
- **Invoice Management** - Create, send, and track invoices with automatic VAT calculation
- **Analytics & Insights** - Comprehensive business analytics and financial insights
- **Danish Localization** - Full support for Danish language, currency (DKK), and CVR numbers

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Modern utility-first CSS framework
- **React Router** - Client-side routing
- **Recharts** - Beautiful charts and data visualization
- **Lucide React** - Clean, modern icons
- **Axios** - HTTP client

### Backend
- **Node.js** with Express
- **TypeScript** - Type-safe server code
- **JWT** - Secure authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## Project Structure

```
nykapitalfinans/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── data/           # Mock data storage
│   │   ├── middleware/     # Auth middleware
│   │   ├── routes/         # API endpoints
│   │   ├── types/          # TypeScript types
│   │   └── index.ts        # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context (Auth)
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   └── vite.config.ts
└── package.json           # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nykapitalfinans
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

   This will install dependencies for both frontend and backend workspaces.

3. **Set up environment variables**

   Backend configuration:
   ```bash
   cd backend
   cp .env.example .env
   ```

   Edit `.env` and configure:
   - `JWT_SECRET` - Change to a secure random string for production
   - `PORT` - Backend server port (default: 3001)
   - `CORS_ORIGIN` - Frontend URL (default: http://localhost:5173)

### Running the Application

#### Development Mode (Both Frontend & Backend)

```bash
# From the root directory
npm run dev
```

This starts both the frontend (port 5173) and backend (port 3001) servers concurrently.

#### Run Frontend Only

```bash
npm run frontend
```

#### Run Backend Only

```bash
npm run backend
```

#### Production Build

```bash
npm run build
```

### Demo Account

Use these credentials to log in:

- **Email:** demo@nykapital.dk
- **Password:** demo123

## Features

### 1. Dashboard
- Overview of all accounts and balances
- Recent transactions
- Monthly income/expense charts
- Quick stats and alerts

### 2. Account Management
- Multiple accounts support
- Multi-currency (DKK, EUR, USD)
- Beautiful card-style UI
- Account details and export

### 3. Transactions
- Real-time transaction tracking
- Advanced filtering and search
- Income/expense categorization
- Transaction status monitoring

### 4. Payments
- Send payments to recipients
- IBAN validation
- Scheduled payments
- Payment history

### 5. Invoicing
- Create professional invoices
- Automatic 25% Danish VAT calculation
- Invoice status tracking (Draft, Sent, Paid, Overdue)
- Customer management with CVR support
- Email integration ready

### 6. Analytics
- Monthly revenue and expense trends
- Cash flow analysis
- Invoice distribution charts
- Key performance indicators
- 6-month historical data

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Accounts
- `GET /api/accounts` - Get all user accounts
- `GET /api/accounts/:id` - Get specific account

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/account/:accountId` - Get account transactions

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create new payment

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get specific invoice
- `POST /api/invoices` - Create new invoice
- `PATCH /api/invoices/:id` - Update invoice status

### Analytics
- `GET /api/analytics` - Get business analytics

## Danish Localization

The application is fully localized for the Danish market:

- **Currency Formatting** - DKK with proper Danish formatting (kr.)
- **Date Formatting** - Danish date format (dd. MMM yyyy)
- **Language** - UI labels in Danish
- **VAT/Moms** - Automatic 25% Danish VAT calculation
- **CVR Numbers** - Support for Danish company registration numbers
- **IBAN** - Danish IBAN format support

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- CORS configuration
- Input validation
- Secure token storage

## Future Enhancements

- [ ] PostgreSQL database integration
- [ ] Real-time notifications
- [ ] Email invoice delivery
- [ ] PDF invoice generation
- [ ] Multi-user support with roles
- [ ] Two-factor authentication
- [ ] Mobile app (React Native)
- [ ] Integration with Danish banking systems
- [ ] Automatic bank reconciliation
- [ ] Expense categorization
- [ ] Tax reporting
- [ ] Document storage

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint and Prettier for code formatting
- Functional React components with hooks
- RESTful API design

### Adding New Features

1. Create types in `backend/src/types` and `frontend/src/types`
2. Add backend routes in `backend/src/routes`
3. Create frontend pages in `frontend/src/pages`
4. Update navigation in `frontend/src/components/Layout.tsx`

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support

For questions or issues, please open an issue on the GitHub repository.

---

**Built with ❤️ for Danish merchants**
