const express = require("express");
const router = express.Router();

const minka = require("../services/minkaService");
const { generateToken } = require("../utils/tokenGenerator");
const { buildSignedTransaction } = require("../utils/transactionBuilder");
const { buildValidHandle, buildAccountHandle } = require("../utils/handles");
const { derivePublicBase64 } = require("../utils/signer");

/**
 * TEST MODE
 * Si TEST_MODE=true:
 *  - No se envía nada a Minka
 *  - Se devuelve el payload firmado
 */
const TEST_MODE = process.env.TEST_MODE === "true";

function testResponse(res, scenario, payload) {
  return res.json({
    testMode: true,
    scenario,
    signedPayload: payload,
  });
}

/* 
   INTENTS
    */

// Listar intents
router.get("/tests/intents", async (req, res) => {
  try {
    const token = await generateToken();
    const result = await minka.minkaRequest({
      method: "GET",
      resource: "intents",
      token,
    });
    res.json(result);
  } catch (e) {
    res.status(500).json(e.response?.data || e.message);
  }
});

// Obtener intent por handle
router.get("/tests/intents/:handle", async (req, res) => {
  try {
    const token = await generateToken();
    const result = await minka.getIntent(req.params.handle, token);
    res.json(result);
  } catch (e) {
    res.status(404).json(e.response?.data || e.message);
  }
});

/* 
   ESCENARIOS DE PAGO
    */

/**
 * Caso 1: Intent de pago básico (transferencia simple)
 */
router.post("/tests/payment/basic", async (req, res) => {
  const publicBase64 = derivePublicBase64();

  const data = {
    handle: buildValidHandle(),
    schema: "payment",
    claims: [
      {
        action: "transfer",
        source: {
          handle: buildAccountHandle("payer", "example.com"),
          custom: {
            name: "Jonathan",
            entityType: "individual",
            documentType: "nidn",
            documentNumber: "123456789",
          },
        },
        target: {
          handle: buildAccountHandle("merchant", "example.com"),
          custom: {
            name: "Comercio Ejemplo",
            entityType: "merchant",
            documentType: "nit",
            documentNumber: "900123456",
          },
        },
        symbol: { handle: "cop" },
        amount: 3000,
      },
    ],
    access: [{ action: "any", signer: { public: publicBase64 } }],
  };

  const signed = buildSignedTransaction(data);
  if (TEST_MODE) return testResponse(res, "PAYMENT_BASIC", signed);

  try {
    const token = await generateToken();
    res.json(await minka.createIntent(signed, token));
  } catch (e) {
    res.status(500).json(e.response?.data || e.message);
  }
});

/**
 * Caso 2: Pago con metadata extendida
 */
router.post("/tests/payment/with-metadata", async (req, res) => {
  const publicBase64 = derivePublicBase64();

  const data = {
    handle: buildValidHandle(),
    schema: "payment",
    claims: [
      {
        action: "transfer",
        source: {
          handle: buildAccountHandle("user01", "wallet.com"),
          custom: {
            name: "Usuario Final",
            entityType: "individual",
          },
        },
        target: {
          handle: buildAccountHandle("store01", "wallet.com"),
          custom: {
            name: "Tienda Demo",
            entityType: "merchant",
          },
        },
        symbol: { handle: "cop" },
        amount: 150000,
        metadata: {
          invoice: "FAC-001",
          description: "Pago de factura",
        },
      },
    ],
    access: [{ action: "any", signer: { public: publicBase64 } }],
  };

  const signed = buildSignedTransaction(data);
  if (TEST_MODE) return testResponse(res, "PAYMENT_WITH_METADATA", signed);

  try {
    const token = await generateToken();
    res.json(await minka.createIntent(signed, token));
  } catch (e) {
    res.status(500).json(e.response?.data || e.message);
  }
});

/**
 * Caso 3: Intent con múltiples claims (batch)
 */
router.post("/tests/payment/multi-claim", async (req, res) => {
  const publicBase64 = derivePublicBase64();

  const data = {
    handle: buildValidHandle(),
    schema: "payment",
    claims: [
      {
        action: "transfer",
        source: {
          handle: buildAccountHandle("payer", "example.com"),
        },
        target: {
          handle: buildAccountHandle("merchant01", "example.com"),
        },
        symbol: { handle: "cop" },
        amount: 50000,
      },
      {
        action: "transfer",
        source: {
          handle: buildAccountHandle("payer", "example.com"),
        },
        target: {
          handle: buildAccountHandle("merchant02", "example.com"),
        },
        symbol: { handle: "cop" },
        amount: 25000,
      },
    ],
    access: [{ action: "any", signer: { public: publicBase64 } }],
  };

  const signed = buildSignedTransaction(data);
  if (TEST_MODE) return testResponse(res, "PAYMENT_MULTI_CLAIM", signed);

  try {
    const token = await generateToken();
    res.json(await minka.createIntent(signed, token));
  } catch (e) {
    res.status(500).json(e.response?.data || e.message);
  }
});

/**
 * Caso 4: Intent dinámico (payload desde body)
 */
router.post("/tests/payment/dynamic", async (req, res) => {
  try {
    const publicBase64 = derivePublicBase64();

    const data = {
      ...req.body,
      access: [{ action: "any", signer: { public: publicBase64 } }],
    };

    const signed = buildSignedTransaction(data);
    if (TEST_MODE) return testResponse(res, "PAYMENT_DYNAMIC", signed);

    const token = await generateToken();
    res.json(await minka.createIntent(signed, token));
  } catch (e) {
    res.status(500).json(e.response?.data || e.message);
  }
});

module.exports = router;
