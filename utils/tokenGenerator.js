const { SignJWT, importJWK } = require("jose");

function toBase64Url(b64) {
    return Buffer.from(b64, "base64").toString("base64url");
}

async function generateToken() {
    const publicKeyBase64 = process.env.PUBLICKEY;
    const privateKeyBase64 = process.env.PRIVATEKEY;

    const jwk = {
        kty: "OKP",
        crv: "Ed25519",
        d: toBase64Url(privateKeyBase64),
        x: toBase64Url(publicKeyBase64),
    };
    const privateKey = await importJWK(jwk, "EdDSA");

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: process.env.JWT_ISS,
        sub: `signer:${process.env.LEDGER_HANDLE}`,
        aud: process.env.LEDGER_HANDLE,
        iat: now,
        exp: now + 60 * 5,
    };

    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "EdDSA", kid: publicKeyBase64 })
        .sign(privateKey);

    return token;
}

module.exports = { generateToken };
