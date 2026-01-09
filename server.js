const express = require("express");

// Importa routers
const intentsRouter = require("./routes/intents");
const anchorsRouter = require("./routes/anchors");

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Prefijos de API
app.use("/intents", intentsRouter);
app.use("/anchors", anchorsRouter);

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
    console.error("Error inesperado:", err);
    res.status(500).json({ error: "Error interno del servidor" });
});

// Arranque del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
