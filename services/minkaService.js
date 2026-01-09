const axios = require("axios");

const urlMinka = process.env.LEDGER_SERVER_URL;
const ledgerHandle = process.env.LEDGER_HANDLE;

// Servicio genérico para intents
async function createIntent(method, payload, token) {
  const config = {
    method,
    url: `${urlMinka}/intents`,
    headers: {
      Authorization: `Bearer ${token}`,
      "x-ledger": ledgerHandle,
      "Content-Type": "application/json",
    },
  };
  if (method === "POST") config.data = payload;
  const response = await axios(config);
  return response.data;
}

// Servicio genérico para anchors
async function createAnchor(method, payload, token) {
  const config = {
    method,
    url: `${urlMinka}/anchors`,
    headers: {
      Authorization: `Bearer ${token}`,
      "x-ledger": ledgerHandle,
      "Content-Type": "application/json",
    },
  };
  if (method === "POST") config.data = payload;
  const response = await axios(config);
  return response.data;
}

module.exports = { createIntent, createAnchor };
