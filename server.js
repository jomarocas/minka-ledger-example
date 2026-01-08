const express = require("express");
const axios = require("axios");
const { decodeJwt } = require("jose");
const { generateToken } = require("./tokenGenerator");
const {
    serializeDataRFC8785,
    createRecordHash,
    createSignatureDigest,
    derivePublicBase64,
    signDigestHex,
    verifySignatureNode,
} = require("./signer");

const app = express();
app.use(express.json());

const urlMinka = process.env.LEDGER_SERVER_URL;

// Helper para construir un handle que cumpla ^\d{8}\d{9}.{3}\d{15}$
function buildValidHandle() {
    // 8 dígitos
    const part1 = String(Math.floor(Math.random() * 1e8)).padStart(8, "0");
    // 9 dígitos
    const part2 = String(Math.floor(Math.random() * 1e9)).padStart(9, "0");
    // 3 caracteres (pueden ser letras mayúsculas/minúsculas o dígitos)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let part3 = "";
    for (let i = 0; i < 3; i++) {
        part3 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // 15 dígitos
    const part4 = String(Math.floor(Math.random() * 1e15)).padStart(15, "0");

    return part1 + part2 + part3 + part4;
}


// GET /intent (control de JWT)
app.get("/intent", async (req, res) => {
    try {
        const token = await generateToken();
        const decoded = decodeJwt(token);
        console.log("GET /intent -> JWT claims:", decoded);

        const response = await axios.get(`${urlMinka}/intents`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "x-ledger": process.env.LEDGER_HANDLE,
            },
            params: { page: { number: 0, size: 10 } },
        });

        res.json(response.data);
    } catch (err) {
        console.error("GET /intent error:", err.response?.data || err.message);
        res.status(500).json({ error: "Error en la petición a Minka" });
    }
});

function buildAccountHandle(prefix, domain) {
    // prefix: "svgs", "cacc", etc.
    // domain: "gnbsudameris.com.co"
    const number = String(Math.floor(Math.random() * 1e10)); // hasta 10 dígitos
    return `${prefix}:${number}@${domain}`;
}

// POST /transaction
app.post("/intents", async (req, res) => {
    try {

        const publicBase64 = derivePublicBase64();

        const data = {
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
                            name: "Jonathan",
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
        };


        // Record hash (JCS)
        const dataStrJCS = serializeDataRFC8785(data);
        const recordHash = createRecordHash(data);

        // Signature digest (string concat)
        const custom = { moment: new Date().toISOString(), status: "created" };
        const signatureDigest = createSignatureDigest(recordHash, custom);

        // Firma y verificación local
        const signatureBase64 = signDigestHex(signatureDigest);
        const sigOK = verifySignatureNode(signatureDigest, signatureBase64);
        const pubOK = data.access[0].signer.public === publicBase64;

        console.log("Record hash (JCS):", recordHash);
        console.log("Signature digest:", signatureDigest);
        console.log("Verificación local de firma (digest):", sigOK);
        console.log("Pública access === pública proof:", pubOK);
        console.log("String JCS (data):", dataStrJCS);

        const proof = {
            method: "ed25519-v2",
            public: publicBase64,
            digest: signatureDigest,
            result: signatureBase64,
            custom,
        };

        const transactionRequest = {
            hash: recordHash,
            data,
            meta: { proofs: [proof] },
        };

        console.log("TransactionRequest:", JSON.stringify(transactionRequest));

        const token = await generateToken();
        const decoded = decodeJwt(token);
        console.log("JWT header kid:", process.env.PUBLICKEY);
        console.log("JWT payload:", decoded);

        // Validación salida: el hash JCS del outgoing data debe coincidir
        const outgoingJson = JSON.stringify(transactionRequest);
        const sent = JSON.parse(outgoingJson);
        const outgoingDataJcsStr = serializeDataRFC8785(sent.data);
        const outgoingDataHash = require("crypto").createHash("sha256").update(outgoingDataJcsStr).digest("hex");
        console.log("¿RecordHash === Hash JCS outgoing?:", outgoingDataHash === recordHash);

        const response = await axios.post(`${urlMinka}/intents`, transactionRequest, {
            headers: {
                Authorization: `Bearer ${token}`,
                "x-ledger": process.env.LEDGER_HANDLE,
                "Content-Type": "application/json",
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error creando transacción:", error.response?.data || error.message);
        res.status(500).json({
            error: error.message,
            reason: error.response?.data?.reason,
            detail: error.response?.data?.detail,
        });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Servidor corriendo en http://localhost:${process.env.PORT || 3000}`);
});
