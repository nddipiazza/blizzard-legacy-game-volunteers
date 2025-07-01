# Blizzard Volunteer Platform

A modern web application for recruiting C++ game software engineers to volunteer on Blizzard's legacy software, specifically StarCraft 2.

## 🌟 Features

- User registration and authentication
- Browse and search volunteer opportunities
- Apply to opportunities that match your skills
- Track application status
- Admin dashboard for project leads
- Skill-matching system for C++ game developers
- Responsive, modern UI

## 🛠️ Technology Stack

- **Frontend**: Next.js with App Router, React, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js
- **Form Handling**: React Hook Form
- **Styling**: TailwindCSS

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- MongoDB instance (local or Atlas)

### Environment Setup

1. Clone the repository
2. Create a `.env.local` file in the root directory with the following variables:

```
MONGODB_URI=mongodb://admin:adminpassword@localhost:27017/blizzard?authSource=admin
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

> Note: The NEXTAUTH_SECRET should be a secure random string. You can generate one with: `openssl rand -base64 32`

### Installation

Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Run mongodb using docker.

We will create a folder called /blizzard

```bash
docker run --name blizzard-mongodb -p 27017:27017 -v blizzard-mongo-data:/data/db -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=adminpassword -d mongo:latest
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Build and Production

Build for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## 📁 Project Structure

- `src/app` - Next.js App Router pages and API routes
- `src/components` - Reusable React components
- `src/lib` - Utility functions and configuration
- `src/models` - Mongoose database models

## 🔒 Authentication

The platform uses NextAuth.js for authentication with:
- Credentials Provider (email/password)
- MongoDB adapter for session management

## 👥 User Roles

- **Volunteer**: Can browse opportunities, apply, and track applications
- **Project Lead**: Can create opportunities and review applications
- **Admin**: Has full access to manage the platform

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
