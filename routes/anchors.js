const express = require("express");
const router = express.Router();
const { generateToken } = require("../utils/tokenGenerator");
const { createAnchor } = require("../services/minkaService");

// GET /v2/anchors
router.get("/", async (req, res) => {
  try {
    const token = await generateToken();
    const data = await createAnchor("GET", null, token);
    res.json(data);
  } catch (err) {
    console.error("GET /anchors error:", err.response?.data || err.message);
    res.status(500).json({ error: "Error en la petición a Minka" });
  }
});

// POST /v2/anchors
router.post("/", async (req, res) => {
  try {
    const token = await generateToken();
    
    const payload = req.body; // aquí recibes el anchor armado desde cliente
    const data = await createAnchor("POST", payload, token);
    res.json(data);
  } catch (err) {
    console.error("POST /anchors error:", err.response?.data || err.message);
    res.status(500).json({ error: "Error creando anchor" });
  }
});

module.exports = router;
