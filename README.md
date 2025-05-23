# AI Image Generator

An AI Image Generator application using Stability AI's API to generate images from text prompts.

## Deployment Instructions for Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier available)
- Stability AI API key

### Steps to Deploy on Vercel

1. **Push your code to GitHub**
   - Create a new repository on GitHub
   - Push your code to the repository

2. **Connect to Vercel**
   - Log in to [Vercel](https://vercel.com/)
   - Click "Add New" > "Project"
   - Import your GitHub repository
   - Configure the project:
     - Framework Preset: Other
     - Root Directory: ./
     - Build Command: npm install
     - Output Directory: ./

3. **Set Environment Variables**
   - After deployment, go to your project settings in Vercel
   - Navigate to "Environment Variables"
   - Add a new variable:
     - Name: `STABILITY_API_KEY`
     - Value: Your Stability AI API key
   - Click "Save"
   - Redeploy your project for the changes to take effect

4. **Deploy**
   - Click "Deploy"
   - Wait for the deployment to complete

5. **Access Your Site**
   - Once deployed, Vercel will provide a URL for your site
   - You can set up a custom domain if desired

## Deployment Instructions for Netlify (Alternative)

### Prerequisites
- GitHub account
- Netlify account (free tier, no credit card required)
- Stability AI API key

### Steps to Deploy on Netlify

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
   # For Vercel
   npm run dev
   
   # For Netlify
   npx netlify dev
   ```
5. Open http://localhost:3000 in your browser

## Notes
- The free tier of Vercel and Netlify have some limitations, but they should be sufficient for this application
- The in-memory storage for tracking generation requests won't persist between function calls in a serverless environment. For a production app, you would use a database.

## Troubleshooting Common Issues

If you encounter issues with your deployment:

1. **API Key Not Working**:
   - Double-check that the environment variable is set correctly in your platform's dashboard
   - Verify the API key is valid by testing it locally
   - After setting environment variables, redeploy your site
   - Use the test-api.html page to test your API key

2. **Function Errors**:
   - Check the function logs in your platform's dashboard:
     - Vercel: Go to your project > Deployments > Click on the latest deployment > Functions
     - Netlify: Functions > api > Logs
   - Common issues include missing dependencies or incorrect paths
   - Test the API connection using the included test-api.html page

3. **"Unexpected token '<', "<!DOCTYPE "... is not valid JSON" Error or 404 Not Found**:
   - This means your API is returning HTML instead of JSON or the endpoint is not found
   - Use the included test-api.html page to test different parts of the API
   - Check that you're using the correct API endpoint URLs
   - Verify that your serverless function is properly configured
   - Check the browser console for the full error message
   - If you see a 404 error, make sure the routes in your function match what the frontend is expecting

4. **CORS Issues**:
   - If you see CORS errors in the browser console, ensure your API function has the proper CORS headers
   - The Express app in the function should have `app.use(cors())` enabled

5. **Build Failures**:
   - Check the deploy logs for any build errors
   - Make sure all dependencies are correctly listed in package.json

6. **Vercel-Specific Issues**:
   - If your API routes aren't working, check the vercel.json configuration
   - Make sure the routes are correctly defined
   - Verify that the API file is in the correct location (api/index.js)
   - Try using the Vercel CLI to debug locally: `npx vercel dev`