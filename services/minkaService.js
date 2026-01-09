const axios = require("axios");

const urlMinka = process.env.LEDGER_SERVER_URL;
const ledgerHandle = process.env.LEDGER_HANDLE;

/**
 * Cliente genérico para Minka Ledger
 * @param {Object} options
 * @param {"GET"|"POST"|"PUT"} options.method
 * @param {"anchors"|"intents"} options.resource
 * @param {string} [options.id] handle / payload / id del recurso
 * @param {Object} [options.payload] body firmado
 * @param {string} options.token JWT del ledger
 */
async function minkaRequest({ method, resource, id, payload, token }) {
  const config = {
    method,
    url: id
      ? `${urlMinka}/${resource}/${encodeURIComponent(id)}`
      : `${urlMinka}/${resource}`,
    headers: {
      Authorization: `Bearer ${token}`,
      "x-ledger": ledgerHandle,
      "Content-Type": "application/json",
    },
  };

  if (payload && (method === "POST" || method === "PUT")) {
    config.data = payload;
  }

  const response = await axios(config);
  return response.data;
}

/* =========================
   ANCHORS
   ========================= */

async function createAnchor(payload, token) {
  return minkaRequest({
    method: "POST",
    resource: "anchors",
    payload,
    token,
  });
}

async function getAnchor(id, token) {
  return minkaRequest({
    method: "GET",
    resource: "anchors",
    id,
    token,
  });
}

async function listAnchors(token) {
  return minkaRequest({
    method: "GET",
    resource: "anchors",
    token,
  });
}

async function disableAnchor(anchorResponse, token) {
  if (!anchorResponse?.data?.handle) {
    throw new Error("Anchor inválido: falta data.handle");
  }

  return minkaRequest({
    method: "PUT",
    resource: "anchors",
    id: anchorResponse.data.handle,
    payload: anchorResponse,
    token,
  });
}

/* =========================
   INTENTS
   ========================= */

async function createIntent(payload, token) {
  return minkaRequest({
    method: "POST",
    resource: "intents",
    payload,
    token,
  });
}

async function getIntent(id, token) {
  return minkaRequest({
    method: "GET",
    resource: "intents",
    id,
    token,
  });
}

module.exports = {
  /* core */
  minkaRequest,

  /* intents */
  createIntent,
  getIntent,

  /* anchors */
  createAnchor,
  getAnchor,
  listAnchors,
  disableAnchor,
};
