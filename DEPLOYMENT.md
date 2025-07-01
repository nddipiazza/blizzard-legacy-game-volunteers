# Deploying the Blizzard Legacy Game Volunteer Platform

This document provides instructions for deploying the Blizzard Legacy Game Volunteer Platform to various hosting services.

## Option 1: Vercel (Recommended)

Vercel is the platform built by the creators of Next.js and provides the easiest deployment experience.

### Prerequisites

1. A [GitHub](https://github.com/) account to push your code
2. A [Vercel](https://vercel.com/) account (you can sign up with your GitHub account)
3. A MongoDB Atlas database (or other MongoDB provider)

### Deployment Steps

1. Push your code to a GitHub repository:

```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create a repository on GitHub and push your code
git remote add origin https://github.com/yourusername/blizzard-legacy-game-volunteer-platform.git
git branch -M main
git push -u origin main
```

2. Connect to Vercel:
   - Go to [Vercel](https://vercel.com/)
   - Sign up or sign in with your GitHub account
   - Click "Add New" -> "Project"
   - Import your GitHub repository
   - Configure project:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Environment Variables: Add your MongoDB URI, NextAuth URL, and NextAuth secret
       - `MONGODB_URI=mongodb+srv://...`
       - `NEXTAUTH_URL=https://your-project-name.vercel.app` (Vercel will provide this URL)
       - `NEXTAUTH_SECRET=your_secret_value`
   - Click "Deploy"

3. After deployment, Vercel will provide you with a URL where your application is hosted.

4. Configure your custom domain (optional):
   - In the Vercel dashboard, go to your project settings
   - Navigate to "Domains"
   - Add your custom domain and follow the verification steps

## Option 2: Railway

Railway is another platform-as-a-service that makes it easy to deploy Next.js applications.

### Deployment Steps

1. Create an account on [Railway](https://railway.app/)
2. Install the Railway CLI: `npm i -g @railway/cli`
3. Login to Railway: `railway login`
4. Initialize your project: `railway init`
5. Deploy your app: `railway up`
6. Add environment variables through the Railway dashboard

## Option 3: Self-hosting with Docker

For more control over your deployment, you can use Docker:

1. Create a `Dockerfile` in your project root:

```dockerfile
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

2. Build and run your Docker container:

```bash
docker build -t blizzard-volunteer-platform .
docker run -p 3000:3000 -e MONGODB_URI=your_mongodb_uri -e NEXTAUTH_URL=your_nextauth_url -e NEXTAUTH_SECRET=your_nextauth_secret blizzard-volunteer-platform
```

## Managing the MongoDB Database

For all deployment options, you'll need a MongoDB database. MongoDB Atlas provides a free tier that's perfect for this project.

### Setting Up MongoDB Atlas (Detailed Steps)

1. **Sign Up for MongoDB Atlas**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and click "Try Free"
   - Fill out the registration form or sign up with Google/GitHub

2. **Create a Free Cluster**
   - Select "FREE" tier (Shared Clusters)
   - Choose any cloud provider (AWS, Google Cloud, or Azure)
   - Select a region closest to your target audience
   - Keep the default Cluster Tier (M0 Sandbox)
   - Name your cluster (e.g., "blizzard-volunteer-platform")
   - Click "Create"

3. **Configure Database Security**
   - **Create a Database User:**
     - Navigate to "Security" > "Database Access"
     - Click "Add New Database User"
     - Authentication Method: Choose "Password"
     - Username: Create a username (e.g., "blizzard-admin")
     - Password: Create a strong password or use "Autogenerate Secure Password"
     - User Privileges: "Read and write to any database"
     - Click "Add User"

   - **Configure Network Access:**
     - Navigate to "Security" > "Network Access"
     - Click "Add IP Address"
     - For development: Select "Allow Access from Anywhere" (0.0.0.0/0)
     - For production: Specify the IP addresses of your application servers
     - Click "Confirm"

4. **Get Your Connection String**
   - Once your cluster is created, click "Connect" on your cluster
   - Select "Connect your application"
   - Choose "Node.js" as the driver and the latest version
   - Copy the connection string:
     ```
     mongodb+srv://<username>:<password>@blizzard-volunteer-platform.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user credentials
   - Add the database name at the end:
     ```
     mongodb+srv://<username>:<password>@blizzard-volunteer-platform.xxxxx.mongodb.net/blizzard?retryWrites=true&w=majority
     ```

5. **Use the Connection String in Your Deployment**
   - Add this connection string as the `MONGODB_URI` environment variable in your deployment platform
   - For Vercel: Add it under Project Settings > Environment Variables

## Continuous Deployment

Both Vercel and Railway support continuous deployment. When you push changes to your GitHub repository, your application will automatically rebuild and deploy.
