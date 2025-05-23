# AI Image Generator

An AI Image Generator application using Stability AI's API to generate images from text prompts.

## Deployment Instructions for Netlify (Free Tier)

### Prerequisites
- GitHub account
- Netlify account (free tier, no credit card required)
- Stability AI API key

### Steps to Deploy

1. **Push your code to GitHub**
   - Create a new repository on GitHub
   - Push your code to the repository

2. **Connect to Netlify**
   - Log in to Netlify
   - Click "New site from Git"
   - Select GitHub and authorize Netlify
   - Select your repository

3. **Configure Build Settings**
   - Build command: `npm install`
   - Publish directory: `.`

4. **Set Environment Variables**
   - In Netlify dashboard, go to Site settings > Environment variables
   - Add the environment variable:
     - Key: `STABILITY_API_KEY`
     - Value: Your Stability AI API key

5. **Deploy**
   - Click "Deploy site"
   - Wait for the deployment to complete

6. **Access Your Site**
   - Once deployed, Netlify will provide a URL for your site
   - You can set up a custom domain if desired

## Local Development

1. Clone the repository
2. Create a `.env` file in the root directory with your Stability AI API key:
   ```
   STABILITY_API_KEY=your_api_key_here
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm start
   ```
5. Open http://localhost:3000 in your browser

## Notes
- The free tier of Netlify has some limitations, but it should be sufficient for this application
- The in-memory storage for tracking generation requests won't persist between function calls in a serverless environment. For a production app, you would use a database.

## Troubleshooting Common Issues

If you encounter issues with your deployment:

1. **API Key Not Working**:
   - Double-check that the environment variable is set correctly in Netlify dashboard
   - Verify the API key is valid by testing it locally
   - After setting environment variables, redeploy your site

2. **Function Errors**:
   - Check the function logs in the Netlify dashboard (Functions > api > Logs)
   - Common issues include missing dependencies or incorrect paths
   - Test the API connection using the included test-api.html page

3. **"Unexpected token '<', "<!DOCTYPE "... is not valid JSON" Error or 404 Not Found**:
   - This means your API is returning HTML instead of JSON or the endpoint is not found
   - Use the included test-api.html page to test different parts of the API
   - Check that you're using the correct API endpoint URLs
   - Verify that your Netlify function is properly configured
   - Check the browser console for the full error message
   - If you see a 404 error, make sure the routes in your Netlify function match what the frontend is expecting

4. **CORS Issues**:
   - If you see CORS errors in the browser console, ensure your API function has the proper CORS headers
   - The Express app in the Netlify function should have `app.use(cors())` enabled

5. **Build Failures**:
   - Check the deploy logs for any build errors
   - Make sure all dependencies are correctly listed in package.json