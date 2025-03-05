# Dreamlands Deployment Guide

This document outlines the steps to deploy both the frontend and backend of the Dreamlands game.

## Frontend Deployment to Netlify

The frontend game is deployed to Netlify for easy hosting and continuous deployment.

### Steps Already Completed

1. Created netlify.toml configuration
2. Set up build command and publish directory
3. Configured frontend API client to dynamically use the correct backend URL

### Manual Steps to Complete

1. Sign up for a free account at [Netlify](https://netlify.com)
2. Connect your GitHub repository:
   - Click "New site from Git" in Netlify
   - Select your GitHub repository
   - Set the publish directory to `dist`
   - Set the build command to `npm run build`
3. Configure environment variables:
   - Go to "Site settings" > "Build & deploy" > "Environment"
   - Add `API_URL` with your backend server URL (after deploying the backend)

## Backend Deployment to Heroku and MongoDB Atlas

The backend server is deployed to Heroku with a MongoDB Atlas database connection.

### Steps Already Completed

1. Created Procfile for Heroku
2. Updated the server code to use environment variables
3. Added cors middleware for cross-origin requests
4. Updated the frontend code to handle connection errors gracefully

### MongoDB Atlas Setup

1. Create a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
2. Create a new project and cluster (free tier M0 is sufficient)
3. Create a database user:
   - Go to "Database Access" > "Add New Database User"
   - Set authentication method to Password
   - Set user privileges to "Read and write to any database"
   - Create the user and note the username and password
4. Configure network access:
   - Go to "Network Access" > "Add IP Address"
   - Choose "Allow access from anywhere" (0.0.0.0/0)
5. Get your connection string:
   - Go to Clusters > "Connect" > "Connect your application"
   - Copy the connection string, which looks like:
     `mongodb+srv://<username>:<password>@cluster0.mongodb.net/dreamlands?retryWrites=true&w=majority`
   - Replace `<username>` and `<password>` with your database user credentials

### Heroku Deployment

1. Create a [Heroku](https://www.heroku.com/) account
2. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli):
   ```bash
   # macOS
   brew install heroku/brew/heroku
   
   # Windows
   # Download installer from https://devcenter.heroku.com/articles/heroku-cli
   ```
3. Log in to Heroku CLI:
   ```bash
   heroku login
   ```
4. Create a new Heroku app:
   ```bash
   heroku create dreamlands-server
   ```
5. Set the MongoDB Atlas connection string:
   ```bash
   heroku config:set MONGO_URI=<your-mongodb-atlas-connection-string>
   ```
6. Deploy the server (using git subtree since it's in a subdirectory):
   ```bash
   git subtree push --prefix server heroku main
   ```
   If you encounter issues with the subtree approach, you can:
   ```bash
   # Clone the repo to a new directory and deploy just the server directory
   cd /tmp
   mkdir heroku-deploy
   cd heroku-deploy
   git init
   heroku git:remote -a <your-heroku-app-name>
   cp -r /path/to/Dreamlands/server/* .
   git add .
   git commit -m "Initial deployment"
   git push heroku main
   ```
7. Check the deployment logs:
   ```bash
   heroku logs --tail
   ```

### Update Netlify Environment Variable

After successfully deploying to Heroku, update your Netlify environment variable:

1. Go to your Netlify dashboard > Site settings > Build & deploy > Environment
2. Add or update the `API_URL` variable with your Heroku app URL (e.g., https://dreamlands-server.herokuapp.com)
3. Trigger a new build in Netlify to apply the changes

## Testing the Deployment

### Test the Backend API

1. Test the health endpoint:
   ```bash
   curl https://your-heroku-app.herokuapp.com/health
   ```
   Expected response: `{"status":"ok"}`

2. Test message creation:
   ```bash
   curl -X POST \
     https://your-heroku-app.herokuapp.com/messages \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test message","x":100,"y":100,"level":"forest"}'
   ```

3. Test message retrieval:
   ```bash
   curl https://your-heroku-app.herokuapp.com/messages
   ```

### Test the Frontend Integration

1. Open your Netlify site URL
2. Navigate to a location in the game
3. Try to post a message
4. Verify that messages from other players appear at their respective coordinates

## Troubleshooting

### Heroku Deployment Issues

- **H10 - App crashed error**:
  - Check the logs with `heroku logs --tail`
  - Verify the Procfile is correctly formatted
  - Ensure all required dependencies are in package.json

- **MongoDB connection issues**:
  - Verify the connection string format
  - Check that you've whitelisted IP addresses in MongoDB Atlas
  - Confirm the database user has correct permissions

### Netlify Deployment Issues

- **Build failures**:
  - Check that the build command is correct
  - Verify that the publish directory is set to `dist`
  - Review the build logs in Netlify

- **API connection issues**:
  - Confirm the `API_URL` environment variable is set correctly
  - Check that CORS is properly configured on the backend
  - Verify in browser developer tools that API requests are going to the correct URL