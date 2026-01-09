// Genera un handle válido para intents
function buildValidHandle() {
  const part1 = String(Math.floor(Math.random() * 1e8)).padStart(8, "0");
  const part2 = String(Math.floor(Math.random() * 1e9)).padStart(9, "0");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let part3 = "";
  for (let i = 0; i < 3; i++) {
    part3 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const part4 = String(Math.floor(Math.random() * 1e15)).padStart(15, "0");
  return part1 + part2 + part3 + part4;
}

// Genera un handle válido para cuentas (source/target)
function buildAccountHandle(prefix, domain) {
  const number = String(Math.floor(Math.random() * 1e10));
  return `${prefix}:${number}@${domain}`;
}

module.exports = { buildValidHandle, buildAccountHandle };
