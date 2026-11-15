---
name: Gemini model availability
description: Model listing alone did not prove direct Gemini generation worked.
---

Check generation support with a small real request before selecting a model for the direct, user-key Gemini integration. A model returned by the provider's model list still returned 404 for generation, while another listed model worked with the same key.

**Why:** Treating the model catalog as definitive would have left planning broken despite apparently valid provider setup.

**How to apply:** When changing the planning model or diagnosing provider errors, verify the exact generation capability rather than assuming a listed model works or changing credentials immediately. Never expose credentials or raw provider errors.
