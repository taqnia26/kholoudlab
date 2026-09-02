import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const generatedPaths = [
  resolve(import.meta.dirname, "..", "api-zod", "src", "generated", "api.ts"),
  resolve(import.meta.dirname, "..", "api-client-react", "src", "generated", "api.ts"),
  resolve(import.meta.dirname, "..", "api-client-react", "src", "generated", "api.schemas.ts"),
];

for (const generatedPath of generatedPaths) {
  const source = await readFile(generatedPath, "utf8");
  const compatibleSource = source
    .replaceAll("zod.int()", "zod.number().int()")
    .replaceAll("zod.email()", "zod.string().email()")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n+$/, "\n");

  if (compatibleSource !== source) {
    await writeFile(generatedPath, compatibleSource);
  }
}