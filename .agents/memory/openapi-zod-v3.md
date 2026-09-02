---
name: OpenAPI Zod v3 generation
description: Compatibility requirement for generated API validation schemas using the workspace's pinned Zod version.
---

Generated OpenAPI Zod output must be passed through the compatibility script before typechecking when newer helper forms are present.

**Why:** The current generator can emit helpers such as `z.int()` and `z.email()`, while the workspace pins Zod v3, whose namespace does not expose those forms. The generated source otherwise fails typechecking and runtime schema construction.

**How to apply:** Keep the API spec's code-generation command responsible for converting them to Zod v3 chains such as `z.number().int()` and `z.string().email()`; do not hand-edit generated files.