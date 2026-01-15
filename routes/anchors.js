const express = require("express");
const router = express.Router();

const minka = require("../services/minkaService");
const { generateToken } = require("../utils/tokenGenerator");
const { buildSignedTransaction } = require("../utils/transactionBuilder");

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
   INFRAESTRUCTURA
    */

router.get("/tests/anchors", async (req, res) => {
  try {
    const token = await generateToken();
    const result = await minka.listAnchors(token);
    res.json(result);
  } catch (e) {
    res.status(500).json(e.response?.data || e.message);
  }
});

router.get("/tests/anchors/:id", async (req, res) => {
  try {
    const token = await generateToken();
    const result = await minka.getAnchor(req.params.id, token);
    res.json(result);
  } catch (e) {
    res.status(404).json(e.response?.data || e.message);
  }
});

/** 
 * test anchors
*/

router.post("/tests/anchor", async (req, res) => {
  const data = {
      "handle": `custom-${Date.now()}`,
      "target": "svgs:99672643@alianza.com.co",
      "symbol": "cop",
      "schema": "business",
      "custom": {
        "lastName": "Alba",
        "aliasType": "merchcode",
        "name": "Ester",
        "secondName": "María",
        "documentType": "cc",
        "documentNumber": "4107292192",
        "secondLastName": "Caraballo",
        "routingCode": "TFY",
        "participantCode": "2310",
        "targetSpbviCode": "SVGS",
        "directory": "centralized"
      }
  };

  const signed = buildSignedTransaction(data);
  if (TEST_MODE) return testResponse(res, "QR_STATIC_MERCHANT", signed);

  try {
    const token = await generateToken();
    res.json(await minka.createAnchor(signed, token));
  } catch (e) {
    res.status(500).json(e.response?.data || e.message);
  }
});

/* 
   QR CODES
    */

/**
 * Caso 1: QR estático comercio físico
 */
router.post("/tests/qr/static/merchant", async (req, res) => {
  const data = {
    handle: `QR-STATIC-${Date.now()}`,
    target: "target:store-account",
    schema: "qr-code",
    custom: {
      target: {
        aliasType: "NIT",
        aliasValue: "900123456-1",
        merchantCode: "STORE-001",
        name: "TIENDA EL AHORRO",
        documentType: "NIT",
        documentNumber: "900123456-1",
        city: "Bogota",
        categoryCode: "5411",
        countryCode: "CO",
      },
      methodOptions: {
        subtype: "STATIC",
      },
    },
  };

  const signed = buildSignedTransaction(data);
  if (TEST_MODE) return testResponse(res, "QR_STATIC_MERCHANT", signed);

  try {
    const token = await generateToken();
    res.json(await minka.createAnchor(signed, token));
  } catch (e) {
    res.status(500).json(e.response?.data || e.message);
  }
});

/**
 * Caso 2: QR dinámico factura con monto
 */
router.post("/tests/qr/dynamic/invoice", async (req, res) => {
  const data = {
    handle: `QR-INVOICE-${Date.now()}`,
    target: "target:merchant-account",
    schema: "qr-code",
    custom: {
      target: {
        aliasType: "NIT",
        aliasValue: "900123456-1",
        merchantCode: "MERCH-001",
        name: "COMERCIO EJEMPLO",
        city: "Medellin",
        categoryCode: "5411",
        countryCode: "CO",
      },
      paymentReference: {
        amount: 1500000,
        currencyCode: "170",
        referenceNumber: "FACT-001",
        channel: "APP",
        paymentReferencePurpose: "COMPRAS",
      },
      methodOptions: {
        subtype: "DINAMIC",
        duration: 86400,
      },
    },
  };

  const signed = buildSignedTransaction(data);
  if (TEST_MODE) return testResponse(res, "QR_DYNAMIC_INVOICE", signed);

  try {
    const token = await generateToken();
    res.json(await minka.createAnchor(signed, token));
  } catch (e) {
    res.status(500).json(e.response?.data || e.message);
  }
});

/**
 * Caso 3: QR FULL PAYLOAD (cumplimiento total)
 */
router.post("/tests/qr/full", async (req, res) => {
  const data = {
    handle: `QR-FULL-${Date.now()}`,
    target: "target:full-account",
    schema: "qr-code",
    custom: {
      target: {
        aliasType: "ALPHANUM",
        aliasValue: "@kamin01",
        merchantCode: "MERCH-999",
        name: "Supermercado Pérez",
        city: "Bogotá",
        categoryCode: "5411",
        countryCode: "CO",
      },
      paymentReference: {
        amount: 100000,
        currencyCode: "170",
        iva: 19000,
        baseIva: 100000,
        channel: "POS",
        paymentReferencePurpose: "COMPRAS",
      },
      methodOptions: {
        subtype: "DINAMIC",
        duration: 3600,
      },
      metadata: {
        description: "QR con todos los campos",
      },
    },
  };

  const signed = buildSignedTransaction(data);
  if (TEST_MODE) return testResponse(res, "QR_FULL", signed);

  try {
    const token = await generateToken();
    res.json(await minka.createAnchor(signed, token));
  } catch (e) {
    res.status(500).json(e.response?.data || e.message);
  }
});

/* 
   LLAVES DINÁMICAS
    */

router.post("/tests/dynamic-key/basic", async (req, res) => {
  const data = {
    handle: `DYNAMIC-KEY-${Date.now()}`,
    target: "target:subscription-account",
    schema: "dynamic-key",
    custom: {
      target: {
        merchantCode: "SUBS-001",
        name: "Servicio de Suscripción",
        city: "Bogota",
        categoryCode: "4899",
        countryCode: "CO",
      },
      methodOptions: {
        suptype: "DYNAMIC",
        duration: 2592000,
      },
    },
  };

  const signed = buildSignedTransaction(data);
  if (TEST_MODE) return testResponse(res, "DYNAMIC_KEY_BASIC", signed);

  try {
    const token = await generateToken();
    res.json(await minka.createAnchor(signed, token));
  } catch (e) {
    res.status(500).json(e.response?.data || e.message);
  }
});

router.post("/tests/dynamic-key/custom-handle", async (req, res) => {
  const data = {
    handle: "@CUSTOM-001",
    target: "target:custom-account",
    schema: "dynamic-key",
    custom: {
      target: {
        merchantCode: "CUSTOM-001",
        name: "Custom Service",
        city: "Bogota",
        categoryCode: "4899",
        countryCode: "CO",
      },
      methodOptions: {
        duration: 86400,
      },
    },
  };

  const signed = buildSignedTransaction(data);
  if (TEST_MODE) return testResponse(res, "DYNAMIC_KEY_CUSTOM_HANDLE", signed);

  try {
    const token = await generateToken();
    res.json(await minka.createAnchor(signed, token));
  } catch (e) {
    res.status(500).json(e.response?.data || e.message);
  }
});

/* 
   CICLO DE VIDA
    */

router.put("/tests/anchors/:handle/disable", async (req, res) => {
  try {
    const token = await generateToken();
    const anchor = await minka.getAnchor(req.params.handle, token);

    anchor.meta.proofs.push({
      method: "ed25519-v2",
      custom: {
        status: "INACTIVE",
        moment: new Date().toISOString(),
      },
    });

    if (TEST_MODE) {
      return testResponse(res, "ANCHOR_DISABLE", anchor);
    }

    res.json(await minka.disableAnchor(anchor, token));
  } catch (e) {
    res.status(500).json(e.response?.data || e.message);
  }
});

module.exports = router;
