const themeToggle = document.querySelector(".theme-toggle");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector("#prompt-input");
const promptBtn = document.querySelector("#prompt-btn");
const generateBtn = document.querySelector("#generate-btn");

const modelSelect = document.querySelector("#model-select");
const countSelect = document.querySelector("#count-select");
const ratioSelect = document.querySelector("#ratio-select");
const gridGallary = document.querySelector(".gallery-grid");


// No API key needed in frontend - it's handled by the server

const examplePrompt = [
  "a photo of an astronaut riding a horse on mars",
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A future Mars colony with glass domes and gardens against red mountains",
  "A dragon sleeping on gold coins in a crystal cave",
  "An underwater kingdom with merpeople and glowing coral buildings",
  "A floating island with waterfalls pouring into clouds below",
  "A witch's cottage in fall with magic herbs in the garden",
  "A robot painting in a sunny studio with art supplies around it",
  "A magical library with floating glowing books and spiral staircases",
  "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
  "A cosmic beach with glowing sand and an aurora in the night sky",
  "A medieval marketplace with colorful tents and street performers",
  "A cyberpunk city with neon signs and flying cars at night",
  "A peaceful bamboo forest with a hidden ancient temple",
  "A giant turtle carrying a village on its back in the ocean",
];

// Theme initialization
(() => {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDarkMode = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const isDarkTheme =
    savedTheme === "dark" || (!savedTheme && systemPrefersDarkMode);
  document.body.classList.toggle("dark-theme", isDarkTheme);
  themeToggle.querySelector("i").className = isDarkTheme
    ? "fa-solid fa-sun"
    : "fa-solid fa-moon";
})();

const toggleTheme = () => {
  const isDarkTheme = !document.body.classList.contains("dark-theme");
  document.body.classList.toggle("dark-theme", isDarkTheme);
  localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
  themeToggle.querySelector("i").className = isDarkTheme
    ? "fa-solid fa-sun"
    : "fa-solid fa-moon";
};

const getImageDimensions = (aspectRatio) => {
  // Allowed sizes for SDXL
  const allowedSizes = {
    "1/1": { width: 1024, height: 1024 },
    "9/7": { width: 1152, height: 896 },
    "19/13": { width: 1216, height: 832 },
    "14/8": { width: 1344, height: 768 },
    "12/5": { width: 1536, height: 640 },
    "5/12": { width: 640, height: 1536 },
    "24/21": { width: 768, height: 1344 },
    "52/38": { width: 832, height: 1216 },
    "56/36": { width: 896, height: 1152 },
  };

  // Try to match aspect ratio to allowed sizes
  if (allowedSizes[aspectRatio]) {
    return allowedSizes[aspectRatio];
  }
  // Default to 1024x1024 if not matched
  return { width: 1024, height: 1024 };
};

const updateImageCard = (imgIndex, imgData) => {
  const imgCard = document.getElementById(`img-card-${imgIndex}`);
  if (!imgCard) return;

  imgCard.classList.remove("loading");

  // Assuming imgData is the base64 string from the server
  const imageUrl = `data:image/png;base64,${imgData}`; // Create a data URL

  imgCard.innerHTML = ` <img src="${imageUrl}" alt="img" class="result-img">
                        <div class="img-overlay">
                            <a href="${imageUrl}" download="${Date.now()}.png" class="img-download-btn">
                                <i class="fa-solid fa-download"></i>
                            </a>
                        </div>`;
};

const generateWithReplicate = async (prompt, aspectRatio) => {
  try {
    // Convert aspect ratio to width and height
    const { width, height } = getImageDimensions(aspectRatio);
    
    // Start the prediction using our Netlify function
    const response = await fetch("/.netlify/functions/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        width: width,
        height: height
      })
    });
    
    let responseData;
    try {
      // Try to parse the response as JSON first
      responseData = await response.json();
    } catch (e) {
      // If it's not JSON, handle the error
      console.error("Failed to parse response as JSON:", e);
      throw new Error(`Server returned invalid JSON. Status: ${response.status}`);
    }
    
    // Now check if the response was ok
    if (!response.ok) {
      const errorMessage = responseData.error || `Server error: ${response.status}`;
      console.error("API Error:", errorMessage);
      throw new Error(errorMessage);
    }
    
    const prediction = responseData;
    console.log("Generation started, ID:", prediction.id);
    
    // Poll for the result using our proxy server
    let result = prediction;
    while (result.status !== "succeeded" && result.status !== "failed") {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const pollResponse = await fetch(`/.netlify/functions/api/prediction/${prediction.id}`);
      
      let pollData;
      try {
        pollData = await pollResponse.json();
      } catch (e) {
        console.error("Failed to parse poll response as JSON:", e);
        throw new Error("Failed to check generation status: Invalid response format");
      }
      
      if (!pollResponse.ok) {
        throw new Error(pollData.error || "Failed to check generation status");
      }
      
      result = pollData;
      console.log("Generation status:", result.status);
    }

    if (result.status === "failed") {
      throw new Error(result.error || "Image generation failed");
    }

    return result.output[0]; // URL to the generated image
  } catch (error) {
    console.error("Error generating image with Replicate:", error);
    throw error;
  }
};



const generateImages = async (
  selectedModel, 
  imageCount,
  aspectRatio, 
  promptText
) => {
  generateBtn.setAttribute("disabled", true);

  const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
    try {
      // Update status to show we're starting generation
      const imgCard = document.getElementById(`img-card-${i}`);
      if (imgCard) {
        imgCard.querySelector(".status-text").textContent = "Starting generation...";
      }
      
      // Generate image with Replicate
      const imageUrl = await generateWithReplicate(promptText, aspectRatio);
      
      // Update the UI with the generated image
      updateImageCard(i, imageUrl);
      console.log(`Image ${i+1} generated successfully using Replicate`);
      
    } catch (error) {
      console.error("Error generating images:", error);
      const imgCard = document.getElementById(`img-card-${i}`);
      if (imgCard) {
        imgCard.classList.replace("loading", "error");
        
        // Display a specific error message
        let errorMessage = "Generation failed. Check console for details.";
        
        // Handle specific error cases
        if (error.message.includes("API Key Invalid") || error.message.includes("API key")) {
          errorMessage = "API Key Invalid or Missing. Please check the server configuration.";
        } else if (error.message.includes("JSON")) {
          errorMessage = "Server communication error. Please try again later.";
        } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message) {
          // Use the error message directly if available
          errorMessage = error.message;
        }
        
        imgCard.querySelector(".status-text").textContent = errorMessage;
      }
    }
  });

  await Promise.allSettled(imagePromises);
  generateBtn.removeAttribute("disabled");
};

const createImageCards = (
  selectedModel,
  imageCount,
  aspectRatio,
  promptText
) => {
  gridGallary.innerHTML = ""; // Clear previous images
  for (let i = 0; i < imageCount; i++) {
    gridGallary.innerHTML += `<div class="img-card loading" id="img-card-${i}" style="--aspect-ratio:${aspectRatio}">
            <div class="status-container">
                <div class="spinner">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <div class="status-text">
                        Generating...
                    </div>
                </div>
            </div>
        </div>`;
  }
};

const handleFormSubmit = (e) => {
  e.preventDefault();

  // Get form values
  const selectedModel = modelSelect.value; // Will always be "deepai-text2img"
  const imageCount = parseInt(countSelect.value) || 1;
  const aspectRatio = ratioSelect.value || "1/1";
  const promptText = promptInput.value.trim();

  if (!promptText) {
    alert("Please enter a prompt to generate images");
    return;
  }

  createImageCards(selectedModel, imageCount, aspectRatio, promptText);
  generateImages(selectedModel, imageCount, aspectRatio, promptText);
  
  console.log("Using Replicate for image generation. Sign up at replicate.com for your own API key.");
};

promptBtn.addEventListener("click", () => {
  const prompt =
    examplePrompt[Math.floor(Math.random() * examplePrompt.length)];
  promptInput.value = prompt;
  promptInput.focus();
});

promptForm.addEventListener("submit", handleFormSubmit);
themeToggle.addEventListener("click", toggleTheme);
