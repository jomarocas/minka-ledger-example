const crypto = require("crypto");
const stringify = require("safe-stable-stringify");
const nacl = require("tweetnacl");

// DER prefixes (docs)
const DER_SECRET_PREFIX_HEX = "302e020100300506032b657004220420";
const DER_PUBLIC_PREFIX_HEX = "302a300506032b6570032100";

function serializeDataRFC8785(data) {
  return stringify(data);
}

function sha256HexFromString(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

function createRecordHash(data) {
  const jcs = serializeDataRFC8785(data);
  return sha256HexFromString(jcs);
}

function getRawKeyMaterial() {
  const privateKeyBase64 = process.env.PRIVATEKEY;
  if (!privateKeyBase64) throw new Error("PRIVATEKEY no está definido en .env");
  const raw = Buffer.from(privateKeyBase64, "base64");
  if (raw.length !== 32 && raw.length !== 64) {
    throw new Error("PRIVATEKEY inválida: debe ser 32 (seed) o 64 (secretKey) bytes en base64");
  }
  return raw;
}

function derivePublicBase64() {
  const raw = getRawKeyMaterial();
  let publicBytes;
  if (raw.length === 32) {
    const kp = nacl.sign.keyPair.fromSeed(new Uint8Array(raw));
    publicBytes = Buffer.from(kp.publicKey);
  } else {
    publicBytes = Buffer.from(raw.slice(32, 64));
  }
  return publicBytes.toString("base64");
}

function createNodePrivateKeyFromRaw() {
  const raw = getRawKeyMaterial();
  const privateRaw32 = raw.length === 32 ? raw : raw.slice(0, 32);
  const derSecretPrefix = Buffer.from(DER_SECRET_PREFIX_HEX, "hex");
  const pkcs8Der = Buffer.concat([derSecretPrefix, privateRaw32]);

  const keyObject = crypto.createPrivateKey({
    format: "der",
    type: "pkcs8",
    key: pkcs8Der,
  });
  return keyObject;
}

function createPublicDerFromRaw() {
  const publicBase64 = derivePublicBase64();
  const publicRawBytes = Buffer.from(publicBase64, "base64");
  const derPublicPrefix = Buffer.from(DER_PUBLIC_PREFIX_HEX, "hex");
  return Buffer.concat([derPublicPrefix, publicRawBytes]);
}

// Signature digest (string concat per docs): sha256(recordHashHex + serialize(custom))
function createSignatureDigest(recordHashHex, signatureCustom) {
  const serializedCustom = signatureCustom ? serializeDataRFC8785(signatureCustom) : "";
  return sha256HexFromString(recordHashHex + serializedCustom);
}

function signDigestHex(digestHex) {
  const keyObject = createNodePrivateKeyFromRaw();
  const digestBytes = Buffer.from(digestHex, "hex");
  const signature = crypto.sign(undefined, digestBytes, keyObject);
  return signature.toString("base64");
}

function verifySignatureNode(digestHex, signatureBase64) {
  const derPublic = createPublicDerFromRaw();
  const keyObject = crypto.createPublicKey({
    format: "der",
    type: "spki",
    key: derPublic,
  });
  const digestBytes = Buffer.from(digestHex, "hex");
  const sigBytes = Buffer.from(signatureBase64, "base64");
  return crypto.verify(undefined, digestBytes, keyObject, sigBytes);
}

module.exports = {
  serializeDataRFC8785,
  createRecordHash,
  createSignatureDigest,
  derivePublicBase64,
  signDigestHex,
  verifySignatureNode,
};
