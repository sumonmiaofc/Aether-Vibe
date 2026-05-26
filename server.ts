import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request size limit to handle base64 image uploads for remixing
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Lazy initializer for GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API Endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Wallpaper Generator Endpoint
app.post("/api/generate", async (req, res) => {
  try {
    const { vibe, referenceImage, remixPrompt } = req.body;
    
    if (!vibe && !referenceImage) {
      return res.status(400).json({ error: "Please enter a visual vibe description or select a reference image to start generating." });
    }

    const ai = getGenAIClient();
    
    // Step 1: Generate 4 highly descriptive visual prompts based on the input vibe using gemini-3.5-flash
    let promptsList: Array<{ title: string; prompt: string }> = [];
    
    if (referenceImage) {
      // Remix Flow (Multimodal analysis of the reference image + new prompt modifiers)
      // Extract the raw base64 portion from the data URL if present
      const base64Data = referenceImage.replace(/^data:image\/\w+;base64,/, "");
      
      const promptStyleInstruction = remixPrompt 
        ? `The user wants to remix this wallpaper with the following custom changes: "${remixPrompt}".`
        : `The user wants to generate 4 beautiful and creatively distinct direct variations of this wallpaper. Keep the same core artistic vibe, characters, and design aesthetic, but change the scene composition, objects, lighting, or specific arrangement.`;

      const multimodalPrompt = `
        You are an advanced creative director and image prompt engineer.
        Analyze this phone wallpaper reference image. Extract its key design characteristics: composition, characters/elements, color palette, rendering medium (e.g., pixel art, watercolor, 3D render, flat illustration, cyberpunk, lo-fi anime), and atmosphere.

        ${promptStyleInstruction}

        Based on your analysis, generate exactly 4 completely distinct and incredibly high-quality image prompts for a 9:16 vertical phone wallpaper generator. 
        Each prompt must be highly detailed, descriptive, visually stunning, and optimized for generating premium, eye-catching phone wallpapers.
        State the visual style clearly (e.g. "detailed lo-fi cyberpunk pixel art", "aesthetic watercolor illustration of...", "hyper-detailed 3D claymation...") in each prompt.
        Specify that the composition is optimized for a phone screen (clean center of focus, beautiful framing, suitable for phone background).

        Return the result strictly as a JSON array of 4 objects, each containing:
        - "title": A short, elegant, human-readable title of the wallpaper (max 3 words). e.g., "Neon Midnight", "Serene Canopy".
        - "prompt": The highly detailed, creative, single-paragraph prompt optimized for an image generator like Imagen, matching the 9:16 aspect ratio description. Keep it descriptive, avoiding abstract metaphors.
      `;

      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      };

      const textPart = {
        text: multimodalPrompt,
      };

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Short creative wallpaper title." },
                prompt: { type: Type.STRING, description: "Highly detailed image generation prompt optimized for 9:16." },
              },
              required: ["title", "prompt"],
            },
          },
        },
      });

      const responseText = aiResponse.text;
      if (!responseText) {
        throw new Error("Failed to analyze the reference image and generate prompts.");
      }
      promptsList = JSON.parse(responseText);
    } else {
      // Fresh Generation Flow (Text vibe input)
      const freshPrompt = `
        You are a stellar creative prompt engineer for an image generation system.
        The user wants to generate 4 distinct phone wallpapers representing this vibe: "${vibe}".
        
        Generate exactly 4 completely distinct interpretations of this vibe. Ensure they differ in subject, lighting, angle, colors, or compositional focus, but all strictly represent the visual core of "${vibe}".
        Each of the 4 prompts must be a highly detailed, visually stunning, single-paragraph image generation prompt tailored for modern mobile screens (9:16 vertical layout).
        Describe specific subjects, artistic mediums (e.g., lo-fi digital drawing, whimsical watercolor, warm pixel art, rich synthwave render, minimalist vector design), lighting (e.g., neon backlight, golden hour sunset, soft ambient twilight), composition (e.g., deep low-angle, centered rule-of-thirds, negative space for widgets), and fine-grained materials.
        
        Return the result strictly as a JSON array of 4 objects, each containing:
        - "title": A short, elegant, human-readable title of the wallpaper (max 3 words).
        - "prompt": The highly detailed, creative, single-paragraph prompt optimized for an image generator, matching the 9:16 aspect ratio description.
      `;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: freshPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Short creative wallpaper title." },
                prompt: { type: Type.STRING, description: "Highly detailed image generation prompt optimized for 9:16." },
              },
              required: ["title", "prompt"],
            },
          },
        },
      });

      const responseText = aiResponse.text;
      if (!responseText) {
        throw new Error("Failed to generate custom wallpaper prompts.");
      }
      promptsList = JSON.parse(responseText);
    }

    // Step 2: Trigger image generation in parallel using 'imagen-3.0-generate-002'
    const imagePromises = promptsList.map(async (item) => {
      try {
        const generation = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: item.prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '9:16',
          },
        });

        if (!generation.generatedImages || generation.generatedImages.length === 0) {
          throw new Error("No image generated for this prompt.");
        }

        const base64Bytes = generation.generatedImages[0].image.imageBytes;
        return {
          title: item.title,
          prompt: item.prompt,
          url: `data:image/jpeg;base64,${base64Bytes}`,
          success: true
        };
      } catch (err: any) {
        console.error(`Error generating image for prompt "${item.title}":`, err);
        return {
          title: item.title,
          prompt: item.prompt,
          url: "",
          success: false,
          error: err.message || "Generation timed out or failed."
        };
      }
    });

    const results = await Promise.all(imagePromises);
    
    // Filter out or handle any failed generations
    const wallpapers = results.map((res, index) => {
      if (res.success) {
        return {
          id: `wp-${Date.now()}-${index}`,
          title: res.title,
          prompt: res.prompt,
          url: res.url,
        };
      } else {
        // Fallback or placeholder in case a specific generation fails to avoid breaking the whole grid
        return {
          id: `wp-fail-${Date.now()}-${index}`,
          title: res.title,
          prompt: res.prompt,
          url: `https://picsum.photos/seed/${encodeURIComponent(res.title + index)}/540/960?blur=5`,
          error: res.error,
          isPlaceholder: true
        };
      }
    });

    res.json({ wallpapers });
  } catch (error: any) {
    console.error("Endpoint Error:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred during wallpaper generation." });
  }
});

// Start routing and server setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
