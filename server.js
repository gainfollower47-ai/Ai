app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.json({ success: false, error: "No prompt" });
    }

    // ✅ Use a REAL working model (text → video)
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "db21e45f8a0c3b8b3b4db3b44b6c1a6f7e9c5a2b3d4c5e6f7a8b9c0d1e2f3a4", // ✅ working model
        input: {
          prompt: prompt
        }
      })
    });

    const data = await response.json();
    console.log("Create response:", data);

    if (!data.id) {
      return res.json({ success: false, error: "API failed", details: data });
    }

    const id = data.id;

    let videoUrl = null;
    let attempts = 0;

    // 🔄 Poll (max 20 tries)
    while (attempts < 20) {
      const check = await fetch(
        `https://api.replicate.com/v1/predictions/${id}`,
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
          error: "Generation failed",
          details: result
        });
      }

      await new Promise(r => setTimeout(r, 3000));
      attempts++;
    }

    if (!videoUrl) {
      return res.json({
        success: false,
        error: "Timeout (try again)"
      });
    }

    // 🎥 Send result
    res.json({
      success: true,
      video_url: videoUrl
    });

  } catch (err) {
    console.error("Error:", err);

    res.json({
      success: false,
      error: err.message
    });
  }
});
