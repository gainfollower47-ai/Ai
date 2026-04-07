const express = require("express");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Multer setup (store file temporarily)
const upload = multer({ dest: "uploads/" });

// ✅ Test route (so browser doesn't show "Cannot GET /")
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

// 🔥 MAIN ROUTE
app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    // ✅ Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image uploaded"
      });
    }

    const prompt = req.body.prompt;

    console.log("Prompt:", prompt);
    console.log("Image file:", req.file.filename);

    // 🚀 TEMP: send dummy video (so frontend works)
    // Later we will replace with real AI
    return res.json({
      success: true,
      video_url:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    });

  } catch (err) {
    console.error("Error:", err);

    res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
});

// ✅ IMPORTANT: use PORT properly (Render needs this)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
