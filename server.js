const express = require("express");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();

// 🔥 Fix fetch for Node
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Multer (image upload)
const upload = multer({ dest: "uploads/" });

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

// 🔥 MAIN API ROUTE
app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.json({ success: false, error: "No prompt" });
    }

    // 🚀 STEP 1: Create prediction
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // ⚠️ Model version (you can change later)
        version: "78379b52c9a6c0c92b0f9a2dba5bb5b4c4b6c6e1e3e3d1c5d2e7f9c8b7a6a5",
        input: {
          prompt: prompt
        }
      })
    });

    const data = await response.json();

    if (!data.id) {
      return res.json({ success: false, error: "API failed" });
    }

    const id = data.id;

    // 🔄 STEP 2: Poll until ready
    let videoUrl = null;

    while (true) {
      const check = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      });

      const result = await check.json();

      if (result.status === "succeeded") {
        videoUrl = Array.isArray(result.output)
          ? result.output[0]
          : result.output;
        break;
      }

      if (result.status === "failed") {
        return res.json({ success: false, error: "Generation failed" });
      }

      // wait 3 sec before checking again
      await new Promise(r => setTimeout(r, 3000));
    }

    // 🎥 STEP 3: Send video to frontend
    res.json({
      success: true,
      video_url: videoUrl
    });

  } catch (err) {
    console.error("Error:", err);

    res.json({
      success: false,
      error: "Server error"
    });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
