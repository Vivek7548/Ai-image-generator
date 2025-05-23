const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Your Stability AI API key from environment variables
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

// Check if API key is available
if (!STABILITY_API_KEY) {
  console.error("WARNING: Stability AI API key is not set. Please set the STABILITY_API_KEY environment variable.");
}

// In-memory storage for tracking generation requests
// In a serverless environment, this won't persist between function calls
// For a production app, you would use a database
const predictions = new Map();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Test endpoint to verify the function is working
app.get('/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    apiKeyPresent: !!STABILITY_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to verify API key
app.get('/test-api-key', async (req, res) => {
  try {
    if (!STABILITY_API_KEY) {
      return res.status(500).json({ 
        error: 'API key is not configured',
        message: 'The STABILITY_API_KEY environment variable is not set'
      });
    }
    
    // Make a simple request to the Stability AI API to verify the key
    const response = await fetch(
      "https://api.stability.ai/v1/user/balance",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${STABILITY_API_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return res.status(response.status).json({
        error: 'API key validation failed',
        message: errorData.message || 'The provided API key is invalid or has insufficient permissions',
        statusCode: response.status
      });
    }
    
    const data = await response.json();
    return res.json({
      success: true,
      message: 'API key is valid',
      credits: data.credits || 'Unknown'
    });
  } catch (error) {
    console.error('Error testing API key:', error);
    return res.status(500).json({
      error: 'Error testing API key',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Endpoint to start a generation
app.post('/generate', async (req, res) => {
  try {
    console.log('Generate endpoint called with body:', JSON.stringify(req.body));
    const { prompt, width, height } = req.body;
    
    // Create a unique ID for this request
    const id = uuidv4();
    
    // Store the prediction with initial "starting" status
    predictions.set(id, {
      id,
      status: "starting",
      input: { prompt, width, height },
      created_at: new Date().toISOString()
    });
    
    // Return immediately with the ID so client can start polling
    res.json({ id, status: "starting" });
    
    // Start the actual generation process in the background
    generateImage(id, prompt, width, height).catch(error => {
      console.error("Background generation error:", error);
      predictions.set(id, {
        ...predictions.get(id),
        status: "failed",
        error: error.message || "Image generation failed"
      });
    });
    
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Function to generate image with Stability AI
async function generateImage(id, prompt, width, height) {
  try {
    // Update status to processing
    predictions.set(id, {
      ...predictions.get(id),
      status: "processing"
    });
    
    // Make the API request to Stability AI
    if (!STABILITY_API_KEY) {
      console.error("API key missing: STABILITY_API_KEY environment variable is not set");
      throw new Error("Stability AI API key is not configured. Please set the STABILITY_API_KEY environment variable.");
    }
    
    // Log that we have an API key (without revealing it)
    console.log("API key is present and will be used for the request");
    
    console.log("Making request to Stability AI API...");
    const response = await fetch(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${STABILITY_API_KEY}`,
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1
            }
          ],
          cfg_scale: 7,
          height: height,
          width: width,
          samples: 1,
          steps: 30,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to generate image";
      
      try {
        // Try to parse as JSON
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
        console.error("Stability AI API error:", errorJson);
        
        // Check for specific error types
        if (errorJson.name === "UnauthorizedError" || errorMessage.includes("API key")) {
          errorMessage = "Invalid API key or authorization failed";
          console.error("API key validation failed");
        }
      } catch (e) {
        // If not JSON, use the text
        console.error("Stability AI API error (raw):", errorText);
        errorMessage = errorText || errorMessage;
      }
      
      // Log the error with status code
      console.error(`Stability AI API error (${response.status}): ${errorMessage}`);
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    // Update with success status
    predictions.set(id, {
      ...predictions.get(id),
      status: "succeeded",
      output: [result.artifacts[0].base64], // Convert base64 to URL
      completed_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error generating image:", error);
    predictions.set(id, {
      ...predictions.get(id),
      status: "failed",
      error: error.message || "Image generation failed"
    });
  }
}

// Endpoint to check prediction status
app.get('/prediction/:id', async (req, res) => {
  try {
    console.log('Prediction status endpoint called for ID:', req.params.id);
    const { id } = req.params;
    
    if (!predictions.has(id)) {
      return res.status(404).json({ error: "Prediction not found" });
    }
    
    const prediction = predictions.get(id);
    res.json(prediction);
    
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Local server running at http://localhost:${PORT}`);
  });
}

// Export the serverless function
module.exports.handler = serverless(app);