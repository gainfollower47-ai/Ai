const express = require("express");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();
const fetch = require("node-fetch");

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Multer setup
const upload = multer({ dest: "uploads/" });

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

// 🔥 MAIN ROUTE (AI VIDEO GENERATION)
app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image uploaded"
      });
    }

    const prompt = req.body.prompt;

    console.log("Prompt:", prompt);

    // ✅ 1. Create prediction
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // ⚠️ Example model (you can change later)
        version: "78379b52c9a6c0c92b0f9a2dba5bb5b4c4b6c6e1e3e3d1c5d2e7f9c8b7a6a5",
        input: {
          prompt: prompt
        }
      })
    });

    const data = await response.json();
    console.log("Prediction:", data);

    const predictionId = data.id;

    // ✅ 2. Poll until finished
    let videoUrl = null;

    while (true) {
      const check = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`
          }
        }
      );

      const result = await check.json();
      console.log("Status:", result.status);

      if (result.status === "succeeded") {
        videoUrl = Array.isArray(result.output)
          ? result.output[0]
          : result.output;
        break;
      }

      if (result.status === "failed") {
        return res.json({
          success: false,
          error: "Generation failed"
        });
      }

      await new Promise((r) => setTimeout(r, 3000));
    }

    // ✅ 3. Send video to frontend
    res.json({
      success: true,
      video_url: videoUrl
    });

  } catch (err) {
    console.error("Error:", err);

    res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
});

// ✅ PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
