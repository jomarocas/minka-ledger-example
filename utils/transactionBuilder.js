const {
    serializeDataRFC8785,
    createRecordHash,
    createSignatureDigest,
    derivePublicBase64,
    signDigestHex,
    verifySignatureNode,
} = require("./signer");

/**
 * Construye y firma un transactionRequest para enviar al ledger.
 * @param {Object} data - El objeto `data` del intent (claims, access, etc.)
 * @returns {Object} transactionRequest firmado
 */
function buildSignedTransaction(data) {
    const publicBase64 = derivePublicBase64();

    // Record hash (JCS)
    const recordHash = createRecordHash(data);

    // Signature digest
    const custom = { moment: new Date().toISOString(), status: "created" };
    const signatureDigest = createSignatureDigest(recordHash, custom);

    // Firma y verificación local
    const signatureBase64 = signDigestHex(signatureDigest);
    //const sigOK = verifySignatureNode(signatureDigest, signatureBase64);
    //const pubOK = data.access[0].signer.public === publicBase64;

    // logs de depuración (comentar en producción)
    // console.log("Record hash (JCS):", recordHash);
    // console.log("Signature digest:", signatureDigest);
    // console.log("Verificación local de firma (digest):", sigOK);
    // console.log("Pública access === pública proof:", pubOK);

    const proof = {
        method: "ed25519-v2",
        public: publicBase64,
        digest: signatureDigest,
        result: signatureBase64,
        custom,
    };

    return {
        hash: recordHash,
        data,
        meta: { proofs: [proof] },
    };
}

module.exports = { buildSignedTransaction };
