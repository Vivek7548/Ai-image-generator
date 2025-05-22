const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

// Your Stability AI API key from environment variables
const STABILITY_API_KEY = process.env.STABILITY_API_KEY || ""; // Set this in your Render dashboard

// In-memory storage for tracking generation requests
// In a production app, you would use a database
const predictions = new Map();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static('./'));

// Endpoint to start a generation
app.post('/api/generate', async (req, res) => {
  try {
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
      const error = await response.json();
      throw new Error(error.message || "Failed to generate image");
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
app.get('/api/prediction/:id', async (req, res) => {
  try {
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

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Open http://localhost:${port}/index.html to use the application`);
});