---
name: Homepage slider animation
description: Stable animation approach for the homepage image carousel in the development preview.
---

Use CSS keyframe animation for small image carousel transitions on the homepage rather than rendering them through Framer Motion.

**Why:** Introducing a motion component into the homepage carousel caused a transient React `Invalid hook call` during Vite hot updates. The CSS implementation keeps the same visual behavior while avoiding a React-runtime dependency for this simple interaction.

**How to apply:** Prefer a fixed-aspect carousel frame with keyed image elements and CSS enter animations. After changing carousel behavior, restart the web workflow once and check browser logs before declaring the page stable.