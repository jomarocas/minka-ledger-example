const express = require("express");
const router = express.Router();
const { generateToken } = require("../utils/tokenGenerator");
const { decodeJwt } = require("jose");
const { createIntent } = require("../services/minkaService");
const { buildValidHandle, buildAccountHandle } = require("../utils/handles");
const { derivePublicBase64 } = require("../utils/signer");

// GET /v2/intents
router.get("/", async (req, res) => {
  try {
    const token = await generateToken();
    const decoded = decodeJwt(token);
    // 🔧 log de depuración (comentar en producción)
    // console.log("GET /intents -> JWT claims:", decoded);

    const data = await createIntent("GET", null, token);
    res.json(data);
  } catch (err) {
    console.error("GET /intents error:", err.response?.data || err.message);
    res.status(500).json({ error: "Error en la petición a Minka" });
  }
});

// POST /v2/intents
router.post("/", async (req, res) => {
  try {
    const token = await generateToken();
    const publicBase64 = derivePublicBase64();

    const data = req.body;

    /*const data = {
      handle: buildValidHandle(),
      schema: "payment",
      claims: [
        {
          action: "transfer",
          source: {
            custom: {
              name: "Jonathan",
              entityType: "individual",
              documentType: "nidn",
              documentNumber: "123456789",
            },
            handle: buildAccountHandle("svgs", "gnbsudameris.com.co"),
          },
          target: {
            custom: {
              name: "Brianne",
              entityType: "individual",
              documentType: "nidn",
              documentNumber: "987654321",
            },
            handle: buildAccountHandle("svgs", "gnbsudameris.com.co"),
          },
          symbol: { handle: "cop" },
          amount: 3000,
        },
      ],
      access: [
        {
          action: "any",
          signer: { public: publicBase64 },
        },
      ],
    };*/

    const response = await createIntent("POST", data, token);
    res.json(response);
  } catch (err) {
    console.error("POST /intents error:", err.response?.data || err.message);
    res.status(500).json({ error: "Error creando intent" });
  }
});

module.exports = router;
