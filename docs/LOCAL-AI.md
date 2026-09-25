# Local AI implementation and verification

The listing enhancer is in `frontend/src/components/Inventory.jsx`; conversation summaries are in `Negotiations.jsx` and the fetched dispute evidence in `Admin.jsx`. `LocalAi.jsx` provides input scope, model selection, progress, cancellation, errors and suggestion review. `lib/local-ai.worker.ts` runs WebLLM off the main thread. The library is installed in the frontend workspace, and the lockfile records the resolved version.

Authenticated `GET /api/ai/local-config` returns public model identifiers and task prompts. It never accepts a listing draft or conversation for inference. Existing listing save, message access and dispute evidence APIs remain authoritative and role-protected. Text is supplied from the state already fetched by those APIs. The prompt directs the model to preserve quantities/prices/conditions and not follow instructions embedded in source text; output still requires human review.

The runtime downloads compiled model weights to browser storage on first use. It does not require Gemini credentials. Downloads can take minutes and inference is hardware-dependent; “zero latency” is not an accurate description. Unsupported WebGPU devices receive a visible explanation rather than a fake summary or undisclosed server fallback. A canceled worker is terminated and the pending UI operation is rejected, so cancellation does not leave the button indefinitely busy.

Native Flutter uses a separately packaged LiteRT-LM model and the same two task prompts. See `mobile/README.md` for device requirements and launch commands.

Sources checked while implementing:

- [WebLLM getting started: WebGPU requirement](https://webllm.mlc.ai/docs/user/get_started.html)
- [WebLLM advanced use: workers](https://webllm.mlc.ai/docs/user/advanced_usage.html)
- [WebLLM API reference](https://webllm.mlc.ai/docs/user/api_reference.html)
- [Flutter Gemma runtime and supported formats](https://pub.dev/packages/flutter_gemma)
- [LiteRT Qwen3 0.6B model card](https://huggingface.co/litert-community/Qwen3-0.6B)

During this work, registration was also corrected to prevent self-provisioning administrator accounts or assigning a verified business badge before KYC review. The overview no longer substitutes a made-up fulfillment percentage when no requests exist.
