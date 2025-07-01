#!/bin/bash

# Deploy script for Blizzard Legacy Game Volunteer Platform

echo "🚀 Deployment Helper for Blizzard Legacy Game Volunteer Platform 🚀"
echo "----------------------------------------------------------------"
echo ""

# Check for git
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

# Check if git repository is initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git add .
    echo "Please enter a commit message for your initial commit:"
    read commit_message
    git commit -m "$commit_message"
else
    echo "Git repository already initialized."
    echo "Committing any changes..."
    git add .
    echo "Please enter a commit message for your changes:"
    read commit_message
    git commit -m "$commit_message"
fi

echo ""
echo "Select deployment platform:"
echo "1) Vercel (Recommended for Next.js)"
echo "2) Railway"
echo "3) Netlify"
echo "4) Docker (Self-hosted)"
read -p "Enter choice (1-4): " platform_choice

case $platform_choice in
    1)
        echo "Preparing for Vercel deployment..."
        echo "Have you created a GitHub repository for this project? (y/n)"
        read has_repo
        
        if [ "$has_repo" = "y" ]; then
            echo "Enter your GitHub repository URL (e.g., https://github.com/yourusername/repo-name.git):"
            read repo_url
            
            git remote add origin $repo_url
            git branch -M main
            git push -u origin main
            
            echo "✅ Code pushed to GitHub."
            echo "📋 Next steps:"
            echo "1. Go to https://vercel.com/new to import your repository"
            echo "2. Select the repository you just pushed to"
            echo "3. Configure your environment variables (MONGODB_URI, NEXTAUTH_URL, NEXTAUTH_SECRET)"
            echo "4. Click 'Deploy'"
        else
            echo "📋 Please follow these steps:"
            echo "1. Create a new repository on GitHub"
            echo "2. Run the following commands to push your code:"
            echo "   git remote add origin YOUR_REPOSITORY_URL"
            echo "   git branch -M main"
            echo "   git push -u origin main"
            echo "3. Go to https://vercel.com/new to deploy from your GitHub repository"
        fi
        ;;
    
    2)
        echo "Preparing for Railway deployment..."
        
        # Check if Railway CLI is installed
        if ! command -v railway &> /dev/null; then
            echo "Railway CLI not found. Would you like to install it? (y/n)"
            read install_railway
            
            if [ "$install_railway" = "y" ]; then
                npm i -g @railway/cli
            else
                echo "❌ Railway CLI is required for deployment to Railway."
                exit 1
            fi
        fi
        
        echo "Logging in to Railway..."
        railway login
        
        echo "Initializing Railway project..."
        railway init
        
        echo "Deploying to Railway..."
        railway up
        
        echo "✅ Deployment initiated."
        echo "📋 Don't forget to set up your environment variables in the Railway dashboard."
        ;;
    
    3)
        echo "Preparing for Netlify deployment..."
        
        # Check if Netlify CLI is installed
        if ! command -v netlify &> /dev/null; then
            echo "Netlify CLI not found. Would you like to install it? (y/n)"
            read install_netlify
            
            if [ "$install_netlify" = "y" ]; then
                npm i -g netlify-cli
            else
                echo "❌ Netlify CLI is required for deployment to Netlify."
                exit 1
            fi
        fi
        
        echo "Logging in to Netlify..."
        netlify login
        
        echo "Initializing Netlify site..."
        netlify init
        
        echo "Deploying to Netlify..."
        netlify deploy
        
        echo "✅ Deployment initiated."
        echo "📋 Don't forget to set up your environment variables in the Netlify dashboard."
        ;;
    
    4)
        echo "Preparing for Docker deployment..."
        
        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker is not installed. Please install Docker first."
            exit 1
        fi
        
        echo "Building Docker image..."
        docker build -t blizzard-legacy-game-volunteer-platform .
        
        echo "✅ Docker image built successfully."
        echo "📋 To run the container locally:"
        echo "docker run -p 3000:3000 -e MONGODB_URI=your_mongodb_uri -e NEXTAUTH_URL=http://localhost:3000 -e NEXTAUTH_SECRET=your_secret_value blizzard-legacy-game-volunteer-platform"
        
        echo ""
        echo "Would you like to run the container now? (y/n)"
        read run_container
        
        if [ "$run_container" = "y" ]; then
            echo "Enter your MongoDB URI:"
            read mongodb_uri
            
            echo "Enter a NextAuth secret key (or press enter for a generated one):"
            read nextauth_secret
            
            if [ -z "$nextauth_secret" ]; then
                nextauth_secret=$(openssl rand -base64 32)
                echo "Generated secret: $nextauth_secret"
            fi
            
            docker run -p 3000:3000 -e MONGODB_URI="$mongodb_uri" -e NEXTAUTH_URL=http://localhost:3000 -e NEXTAUTH_SECRET="$nextauth_secret" blizzard-legacy-game-volunteer-platform
        fi
        ;;
    
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "Deployment preparation complete! 🎉"
