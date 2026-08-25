---
name: OpenAPI Zod v3 generation
description: Compatibility requirement for generated API validation schemas using the workspace's pinned Zod version.
---

Generated OpenAPI Zod output must be passed through the compatibility script before typechecking when integer fields are present.

**Why:** The current generator emits `z.int()` for OpenAPI integers, while the workspace pins Zod v3, whose namespace does not expose that helper. The generated source otherwise fails both typechecking and runtime schema construction.

**How to apply:** Keep the API spec's code-generation command responsible for the conversion to `z.number().int()` so future regeneration remains reproducible; do not hand-edit generated files.