import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const appSource = await readFile(
  new URL("../src/App.tsx", import.meta.url),
  "utf8",
)
const whatsappPageSource = await readFile(
  new URL("../src/pages/whatsapp.tsx", import.meta.url),
  "utf8",
)

test("keeps the /whatsapp route connected to the WhatsApp page", () => {
  assert.match(
    appSource,
    /<Route\s+path=["']\/whatsapp["']\s+component=\{WhatsApp\}\s*\/>/,
    "Expected App.tsx to expose the WhatsApp page at /whatsapp",
  )
})

test("keeps the conversation button on WhatsApp Web with the correct number", () => {
  assert.match(
    whatsappPageSource,
    /const phoneNumber = ["']966559070400["']/,
    "Expected the protected WhatsApp number to remain 966559070400",
  )
  assert.match(
    whatsappPageSource,
    /const whatsappUrl\s*=\s*["']https:\/\/web\.whatsapp\.com\/send\/\?phone=966559070400&/,
    "Expected the conversation URL to use WhatsApp Web and the protected number",
  )
  assert.match(
    whatsappPageSource,
    /<a[\s\S]*?href=\{whatsappUrl\}[\s\S]*?>[\s\S]*?فتح المحادثة[\s\S]*?<\/a>/,
    "Expected the Open conversation button to use whatsappUrl",
  )
})