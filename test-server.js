const fetch = require('node-fetch');

const testServer = async () => {
  try {
    console.log("Testing server API...");
    
    // Test the generate endpoint
    const response = await fetch("http://localhost:3000/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: "a simple test image",
        width: 512,
        height: 512
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error("Server test failed:", error);
      return;
    }
    
    const prediction = await response.json();
    console.log("Generation started successfully:", prediction);
    
    // Test the prediction status endpoint
    console.log(`Checking status for prediction ${prediction.id}...`);
    
    // Poll a few times to see status changes
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`http://localhost:3000/api/prediction/${prediction.id}`);
      if (!statusResponse.ok) {
        console.error("Failed to check prediction status");
        return;
      }
      
      const result = await statusResponse.json();
      console.log(`Status check ${i+1}:`, result.status);
      
      if (result.status === "succeeded") {
        console.log("Image generated successfully:", result.output[0]);
        break;
      }
      
      if (result.status === "failed") {
        console.error("Image generation failed:", result.error);
        break;
      }
    }
    
    console.log("Server test completed");
  } catch (error) {
    console.error("Error testing server:", error);
  }
};

testServer();