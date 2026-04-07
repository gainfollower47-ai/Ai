const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// 🔥 Generate Video Route
app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const imagePath = req.file.path;

    console.log("Prompt:", prompt);
    console.log("Image:", imagePath);

    // STEP 1: Upload image to temporary hosting (you can use Cloudinary or similar)
    // For demo, we'll assume it's accessible publicly

    // STEP 2: Call Replicate API (example model)
    const response = await axios.post(
      "https://api.replicate.com/v1/predictions",
      {
        version: "db21e45c6c2a8b1d1b5e2f9bcb8c4d8a", // example model version
        input: {
          image: "https://your-public-image-url.com/image.jpg",
          prompt: prompt
        }
      },
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    const prediction = response.data;

    // STEP 3: Poll until complete
    let result;
    while (true) {
      const poll = await axios.get(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`
          }
        }
      );

      if (poll.data.status === "succeeded") {
        result = poll.data.output;
        break;
      }

      if (poll.data.status === "failed") {
        throw new Error("Generation failed");
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    res.json({
      success: true,
      videoUrl: result
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
