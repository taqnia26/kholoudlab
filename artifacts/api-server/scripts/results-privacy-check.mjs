import assert from "node:assert/strict";

const apiBaseUrl = process.env.RESULTS_API_BASE_URL ?? "http://localhost:8080/api";

async function startVerification(data) {
  const response = await fetch(`${apiBaseUrl}/results/verification/start`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return { status: response.status, body: await response.json() };
}

const matching = await startVerification({
  analysisNumber: "KL-2026-0001",
  dateOfBirth: "1992-06-15",
  phoneLast4: "0400",
});
const nonMatching = await startVerification({
  analysisNumber: "KL-2026-9999",
  dateOfBirth: "1992-06-15",
  phoneLast4: "0400",
});

assert.equal(matching.status, 202);
assert.equal(nonMatching.status, 202);
assert.deepEqual(Object.keys(matching.body).sort(), Object.keys(nonMatching.body).sort());
assert.equal(matching.body.maskedPhone, "•••• ••••");
assert.equal(nonMatching.body.maskedPhone, matching.body.maskedPhone);
assert.equal(nonMatching.body.expiresInSeconds, matching.body.expiresInSeconds);
assert.equal(nonMatching.body.demoCode, matching.body.demoCode);
assert.equal(typeof matching.body.challengeId, "string");
assert.equal(typeof nonMatching.body.challengeId, "string");

console.log("Result-verification start responses do not disclose report existence.");