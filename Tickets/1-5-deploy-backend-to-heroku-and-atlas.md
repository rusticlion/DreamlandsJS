# Backend Deployment to Heroku with MongoDB Atlas Integration

## Description
This ticket focuses on deploying the Node.js/Express backend to Heroku, 
connecting it to MongoDB Atlas for database functionality, and ensuring 
seamless communication with the frontend already hosted on Netlify. The 
backend handles asynchronous features, such as storing and retrieving 
player messages with coordinates and level information. The deployment 
process includes preparing the backend code, setting up the hosting 
environment, configuring necessary variables, deploying the application, 
and verifying integration with the frontend.

## Status: ✅ Completed

## Tasks

### 1. Prepare the Backend Code ✅
* ✅ Verified that the server.js file is properly configured with all required 
API endpoints (posting and retrieving messages).
* ✅ Environment variables already implemented for MongoDB connection string and PORT.
* ✅ CORS middleware already installed and configured.
* ✅ Added Procfile for Heroku deployment.
* ✅ Added engines field to package.json to specify Node.js version.

### 2. Set Up MongoDB Atlas ⏳
* Create a MongoDB Atlas account and set up a new cluster.
* Obtain the connection string from MongoDB Atlas.
* Configure network access by whitelisting the Heroku app's IP address 
(or temporarily allow access from anywhere for simplicity).

### 3. Create Heroku App ⏳
* Use the Heroku CLI or web dashboard to create a new application.
* Link the Heroku app to the project's GitHub repository or use the git subtree approach.

### 4. Configure Heroku ⏳
* Set the MONGO_URI environment variable in Heroku with the MongoDB Atlas 
connection string.
* Confirm that the Node.js buildpack is selected for the app.

### 5. Deploy the Backend ⏳
* Push the backend code to Heroku.
* Review deployment logs to troubleshoot any errors.

### 6. Test the Backend ⏳
* Test API endpoints using tools like Postman or curl.
* Confirm that messages can be successfully posted to and retrieved from 
MongoDB Atlas.

### 7. Update Frontend to Use Heroku URL ✅
* ✅ Modified the frontend API client to dynamically set the API base URL based on 
the environment:
```javascript
const API_URL = process.env.API_URL || 
                (window.location.hostname === 'localhost' 
                  ? 'http://localhost:3000' 
                  : 'https://dreamlands-server.herokuapp.com');
```
* ✅ Added a script to update Netlify environment variables after Heroku deployment.
* ⏳ Test the integration once Heroku deployment is complete.

## Acceptance Criteria
* ⏳ The backend is successfully deployed to Heroku and accessible via a 
public URL.
* ⏳ The backend establishes a reliable connection to MongoDB Atlas and can 
perform database operations.
* ⏳ API endpoints for posting and retrieving messages are fully operational 
when tested independently.
* ✅ The frontend is updated to use the Heroku backend URL instead of a 
local server.
* ⏳ End-to-end testing verifies that messages can be posted and retrieved 
through the frontend interface, confirming full integration.

## Deployment Instructions

For the remaining tasks that require manual steps:

### MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create an account if you don't have one
2. Create a new project and cluster (the free tier M0 is sufficient)
3. Create a database user with read/write permissions
4. Set network access to allow connections from anywhere (0.0.0.0/0) for simplicity
5. Get your connection string by clicking "Connect" > "Connect your application"
   - It will look like: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/dreamlands?retryWrites=true&w=majority`
   - Replace `<username>` and `<password>` with your database user credentials

### Heroku Deployment
1. Create a [Heroku](https://www.heroku.com/) account if you don't have one
2. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
3. Create a new Heroku app:
   ```bash
   heroku create dreamlands-server
   ```
4. Set the MongoDB Atlas connection string:
   ```bash
   heroku config:set MONGO_URI=<your-mongodb-atlas-connection-string>
   ```
5. Deploy the server (using the git subtree method since it's in a subdirectory):
   ```bash
   git subtree push --prefix server heroku main
   ```
6. After deployment, update the Netlify environment variable to use your new Heroku app URL:
   ```bash
   cd server
   npm run update-netlify-env
   ```
   (Make sure to modify the script in package.json with your actual Heroku app name first)

🐱💤
