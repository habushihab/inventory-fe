# IT Asset Management System - Frontend

A comprehensive Angular-based web application for managing IT assets, employee assignments, and inventory tracking across an organization.

## 🚀 Project Overview

This inventory management system provides a complete solution for tracking and managing IT assets within an organization. It supports role-based access control, asset lifecycle management, employee assignments, and comprehensive reporting capabilities.

## 🏢 Business Domain

The application manages the complete IT asset lifecycle from procurement to disposal, including:
- **Asset Management**: Track laptops, monitors, mobile phones, keyboards, mice, headsets, webcams, printers, networking equipment, tablets, and other IT equipment
- **Employee Management**: Maintain employee records and departmental information
- **Location Management**: Track assets across different organizational locations
- **Assignment Management**: Manage asset assignments to employees with full audit trail
- **Reporting & Analytics**: Generate insights on asset utilization, warranty status, and inventory metrics

## 📱 Application Pages & Features

### 🔐 Login Page (`/login`)
- **Purpose**: Secure authentication gateway
- **Features**:
  - JWT-based authentication
  - Form validation
  - Session management
  - Redirect to dashboard upon successful login

### 📊 Dashboard (`/dashboard`)
- **Purpose**: Central overview and key performance indicators
- **Features**:
  - Asset summary statistics (total, available, assigned, under maintenance, retired, lost)
  - Asset distribution by category and department
  - Monthly trends and analytics
  - Asset warranty tracking
  - Recent assignments overview
  - Quick navigation to all modules
- **Access**: All authenticated users

### 💻 Assets Management (`/assets`)
- **Purpose**: Complete asset inventory management
- **Features**:
  - **Asset CRUD Operations**: Create, read, update, and delete assets
  - **Asset Categories**: Laptops, Monitors, Mobile Phones, Keyboards, Mice, Headsets, Webcams, Printers, Routers, Switches, Access Points, Tablets, and Other
  - **Asset Status Tracking**: Available, Assigned, Under Maintenance, Retired, Lost
  - **Condition Management**: Very Bad, Bad, Low, Good, Very Good, New
  - **Detailed Asset Information**:
    - Barcode generation and scanning
    - Manufacturer and model details
    - Serial numbers and operating systems
    - Purchase information and pricing
    - Warranty tracking with expiration monitoring
    - Current assignment and employee details
  - **Advanced Search & Filtering**: By category, status, condition, location, employee
  - **Asset Timeline**: Complete audit trail of all asset activities
  - **Bulk Operations**: Import/export asset data
  - **Assignment Management**: Direct asset assignment to employees
- **Access**: All authenticated users

### 👥 Employee Management (`/employees`)
- **Purpose**: Maintain employee database for asset assignments
- **Features**:
  - **Employee CRUD Operations**: Add, edit, view, and manage employee records
  - **Employee Information**:
    - Personal details (name, email, phone, employee ID)
    - Department and job title
    - Location assignment
    - Profile photo management
  - **Assignment History**: View all assets currently and previously assigned to each employee
  - **Department Management**: Organize employees by departments
  - **Search & Filter**: Find employees by name, department, or location
  - **Asset Assignment**: Direct assignment of assets to employees
- **Access**: All authenticated users

### 🏢 Location Management (`/locations`)
- **Purpose**: Manage organizational locations and facilities
- **Features**:
  - **Location CRUD Operations**: Create and manage office locations, buildings, and facilities
  - **Location Information**:
    - Location name and address details
    - Contact information
    - Capacity and facility type
  - **Asset Tracking**: View all assets located at each facility
  - **Employee Assignment**: Track which employees are based at each location
  - **Location Hierarchy**: Support for multi-level location structures (buildings, floors, rooms)
- **Access**: All authenticated users

### 📋 Assignments Management (`/assignments`)
- **Purpose**: Track and manage asset assignments to employees
- **Features**:
  - **Assignment Lifecycle Management**: 
    - Create new assignments with start/end dates
    - Track assignment status and conditions
    - Process asset returns and transfers
  - **Assignment History**: Complete audit trail of all assignments
  - **Batch Operations**: Assign multiple assets to employees simultaneously
  - **Assignment Reports**: Generate assignment summaries and analytics
  - **Notification System**: Alerts for overdue returns and warranty expirations
  - **Transfer Management**: Handle asset transfers between employees
  - **Condition Tracking**: Monitor asset condition during assignments
- **Access**: All authenticated users

### 📈 Reports & Analytics (`/reports`)
- **Purpose**: Comprehensive reporting and business intelligence
- **Features**:
  - **Asset Utilization Reports**: Track asset usage across departments and locations
  - **Warranty Management**: Monitor warranty status and upcoming expirations
  - **Financial Reports**: Asset valuation, depreciation, and cost analysis
  - **Assignment Reports**: Employee assignment history and current allocations
  - **Inventory Reports**: Stock levels, availability, and procurement needs
  - **Audit Reports**: Complete audit trails and compliance reporting
  - **Custom Dashboards**: Configurable charts and metrics
  - **Export Capabilities**: PDF and Excel export for all reports
  - **Scheduled Reports**: Automated report generation and distribution
- **Access**: IT Officers and Administrators only

### ⚙️ Admin Panel (`/admin`)
- **Purpose**: System administration and advanced configuration
- **Features**:
  - **User Management**: 
    - Create and manage user accounts
    - Role assignment (Viewer, IT Officer, Admin)
    - Permission management
  - **System Configuration**: 
    - Application settings and preferences
    - Category and status management
    - Workflow configurations
  - **Audit Logs**: Complete system activity tracking
  - **Data Management**: 
    - Bulk data import/export
    - Data cleanup and maintenance tools
  - **System Health**: Monitor application performance and usage statistics
  - **Backup & Restore**: Data backup management
- **Access**: Administrators only

### 👤 Profile Management (`/profile`)
- **Purpose**: Personal account management
- **Features**:
  - **Profile Information**: Update personal details and contact information
  - **Password Management**: Change password and security settings
  - **Notification Preferences**: Configure email and system notifications
  - **Activity History**: View personal activity log and recent actions
  - **Theme Preferences**: Customize application appearance
- **Access**: All authenticated users

## 🔐 Security & Access Control

### User Roles
- **Viewer**: Read-only access to assets, employees, locations, and assignments
- **IT Officer**: Full access to all modules except admin functions; can manage assets, employees, and generate reports
- **Admin**: Complete system access including user management and system configuration

### Security Features
- JWT-based authentication with secure token management
- Role-based access control (RBAC) with route guards
- Session timeout and automatic logout
- Secure API communication with interceptors
- Input validation and XSS protection

## 🛠 Technology Stack

- **Frontend Framework**: Angular 18.2.0
- **UI Framework**: Tailwind CSS with custom components
- **Authentication**: JWT tokens with refresh mechanism
- **State Management**: RxJS for reactive data flow
- **HTTP Client**: Angular HttpClient with interceptors
- **Routing**: Angular Router with guards
- **Forms**: Reactive Forms with validation
- **Testing**: Jasmine and Karma
- **Build Tool**: Angular CLI

## 📁 Project Structure

```
src/
├── app/
│   ├── core/                    # Core services, guards, and models
│   │   ├── guards/             # Authentication and role guards
│   │   ├── interceptors/       # HTTP interceptors
│   │   ├── models/             # TypeScript interfaces and enums
│   │   ├── services/           # Business logic services
│   │   └── utils/              # Utility functions
│   ├── shared/                 # Reusable components and utilities
│   │   ├── components/         # Shared UI components
│   │   ├── layout/             # Application layout components
│   │   └── styles/             # Shared styles
│   ├── [feature-modules]/      # Feature-specific components
│   └── environments/           # Environment configurations
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Angular CLI (`npm install -g @angular/cli`)

### Development Server
```bash
ng serve
```
Navigate to `http://localhost:4200/` for the development server.

### Building the Application
```bash
ng build
```
Build artifacts will be stored in the `dist/` directory.

### Running Tests
```bash
ng test          # Unit tests
ng e2e           # End-to-end tests
```

## 🔧 Development Commands

```bash
ng generate component component-name    # Generate new component
ng generate service service-name        # Generate new service
ng generate guard guard-name           # Generate new guard
ng build --configuration production    # Production build
ng serve --open                       # Start dev server and open browser
```

## 📄 Additional Information

For more help with Angular CLI commands, run `ng help` or visit the [Angular CLI Documentation](https://angular.dev/tools/cli).
