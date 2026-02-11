# Salon Management System

A comprehensive salon management system built with Node.js, Express, MySQL, and vanilla JavaScript.

## Features

-   **Dashboard**: Real-time statistics and overview
-   **Customer Management**: Add, edit, and manage customer profiles
-   **Service Management**: Create and manage salon services
-   **Booking System**: Schedule and manage appointments
-   **Billing & Invoicing**: Create invoices and track payments
-   **Expense Tracking**: Record and categorize business expenses
-   **Reports**: Generate revenue, appointments, and profit reports
-   **User Management**: Role-based access control (Owner, Center Manager, Staff)
-   **Settings**: Configure salon information and preferences

## Tech Stack

### Backend

-   Node.js
-   Express.js
-   MySQL
-   JWT Authentication
-   bcryptjs for password hashing

### Frontend

-   Vanilla JavaScript (ES6+)
-   CSS3 with modern styling
-   Modular architecture
-   RESTful API integration

## Installation

### Prerequisites

-   Node.js (v14 or higher)
-   MySQL (v5.7 or higher)

### Setup Steps

1.  **Clone the repository**
    
    ```bash
    git clone <repository-url>
    cd salon-management-system
    ```
    
2.  **Install backend dependencies**
    
    ```bash
    cd backend
    npm install
    ```
    
3.  **Configure database**
    
    ```bash
    # Create MySQL database
    mysql -u root -p -e "CREATE DATABASE salon_system_ks;"
    
    # Import schema
    mysql -u root -p salon_system_ks < ../database/schema/users.sql
    mysql -u root -p salon_system_ks < ../database/schema/customers.sql
    mysql -u root -p salon_system_ks < ../database/schema/services.sql
    mysql -u root -p salon_system_ks < ../database/schema/memberships.sql
    mysql -u root -p salon_system_ks < ../database/schema/appointments.sql
    mysql -u root -p salon_system_ks < ../database/schema/billing.sql
    mysql -u root -p salon_system_ks < ../database/schema/expenses.sql
    mysql -u root -p salon_system_ks < ../database/schema/reports.sql
    
    # Import seed data
    mysql -u root -p salon_system_ks < ../database/seed/users.sql
    ```
    
4.  **Generate password hashes**
    
    ```bash
    node generate_hashes.js
    ```
    
    Copy the generated hashes and update `database/seed/users.sql` with them.
    
5.  **Configure environment variables**
    
    Edit `backend/.env`:
    
    ```env
    PORT=3000
    NODE_ENV=development
    
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_password
    DB_NAME=salon_system_ks
    DB_PORT=3307
    
    JWT_SECRET=your-secret-key
    JWT_EXPIRE=7d
    
    FRONTEND_URL=http://localhost:3000
    ```
    
6.  **Start the server**
    
    ```bash
    npm start
    ```
    
7.  **Access the application**
    
    Open your browser and navigate to: `http://localhost:3000`
    

## Default Credentials

After importing seed data, you can use these credentials:

-   **Owner**: owner@gmail.com / owner@123
-   **Center Manager**: center@gmail.com / center@123
-   **Staff**: staff@gmail.com / staff@123

## Project Structure

```
salon-management-system/
├── backend/
│   ├── config/
│   │   ├── auth.js
│   │   └── database.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── customers.controller.js
│   │   ├── services.controller.js
│   │   ├── bookings.controller.js
│   │   ├── billing.controller.js
│   │   ├── expenses.controller.js
│   │   ├── reports.controller.js
│   │   └── settings.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   └── error.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── customer.model.js
│   │   ├── service.model.js
│   │   ├── appointment.model.js
│   │   ├── invoice.model.js
│   │   └── expense.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── customers.routes.js
│   │   ├── services.routes.js
│   │   ├── bookings.routes.js
│   │   ├── billing.routes.js
│   │   ├── expenses.routes.js
│   │   ├── reports.routes.js
│   │   └── settings.routes.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── helpers.js
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── database/
│   ├── schema/
│   │   ├── users.sql
│   │   ├── customers.sql
│   │   ├── services.sql
│   │   ├── appointments.sql
│   │   ├── billing.sql
│   │   ├── expenses.sql
│   │   └── reports.sql
│   └── seed/
│       └── users.sql
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   │   └── main.css
│   │   └── js/
│   │       ├── api.js
│   │       ├── auth.js
│   │       ├── utils.js
│   │       ├── permissions.js
│   │       ├── app.js
│   │       └── login.js
│   ├── modules/
│   │   ├── dashboard/
│   │   ├── customers/
│   │   ├── services/
│   │   ├── bookings/
│   │   ├── billing/
│   │   ├── expenses/
│   │   ├── reports/
│   │   └── settings/
│   ├── login.html
│   └── app.html
├── generate_hashes.js
├── verify_system.js
├── package.json
└── README.md
```

## API Endpoints

### Authentication

-   `POST /api/auth/login` - User login
-   `POST /api/auth/logout` - User logout
-   `GET /api/auth/profile` - Get user profile
-   `PUT /api/auth/profile` - Update user profile

### Dashboard

-   `GET /api/dashboard/stats` - Get dashboard statistics

### Customers

-   `GET /api/customers` - Get all customers
-   `GET /api/customers/:id` - Get customer by ID
-   `POST /api/customers` - Create customer
-   `PUT /api/customers/:id` - Update customer
-   `DELETE /api/customers/:id` - Delete customer
-   `GET /api/customers/search?q=query` - Search customers

### Services

-   `GET /api/services` - Get all services
-   `GET /api/services/:id` - Get service by ID
-   `POST /api/services` - Create service
-   `PUT /api/services/:id` - Update service
-   `DELETE /api/services/:id` - Delete service

### Bookings

-   `GET /api/bookings` - Get all appointments
-   `GET /api/bookings/:id` - Get appointment by ID
-   `POST /api/bookings` - Create appointment
-   `PUT /api/bookings/:id` - Update appointment
-   `PATCH /api/bookings/:id/status` - Update appointment status
-   `DELETE /api/bookings/:id` - Delete appointment

### Billing

-   `GET /api/billing` - Get all invoices
-   `GET /api/billing/:id` - Get invoice by ID
-   `POST /api/billing` - Create invoice
-   `PUT /api/billing/:id` - Update invoice
-   `PATCH /api/billing/:id/status` - Update invoice status
-   `DELETE /api/billing/:id` - Delete invoice

### Expenses

-   `GET /api/expenses` - Get all expenses
-   `GET /api/expenses/:id` - Get expense by ID
-   `POST /api/expenses` - Create expense
-   `PUT /api/expenses/:id` - Update expense
-   `DELETE /api/expenses/:id` - Delete expense

### Reports

-   `GET /api/reports/revenue` - Revenue report
-   `GET /api/reports/appointments` - Appointments report
-   `GET /api/reports/profit` - Profit report
-   `GET /api/reports/services` - Service performance report

### Settings

-   `GET /api/settings` - Get settings
-   `PUT /api/settings` - Update settings
-   `GET /api/settings/users` - Get all users
-   `POST /api/settings/users` - Create user
-   `PUT /api/settings/users/:id` - Update user
-   `DELETE /api/settings/users/:id` - Delete user

## Role-Based Access Control

### Owner

-   Full access to all features
-   Can manage users
-   Can configure settings

### Center Manager

-   Full access except user management
-   Can configure settings

### Staff

-   Limited access
-   Can manage customers and bookings
-   Can view reports
-   Cannot manage settings or users

## Development

### Running in development mode

```bash
npm run dev
```

### Running the verification script

```bash
node verify_system.js
```

## License

MIT

## Support

For issues and questions, please open an issue on the repository.