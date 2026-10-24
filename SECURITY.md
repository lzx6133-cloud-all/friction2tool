# Security Policy

Friction2Tool is an experimental, local-first MVP. It has no backend and does not
store user data on a server.

## API keys

- API keys are stored unencrypted in the visitor's browser `localStorage`.
- For API mode, the key is sent directly from the browser to the configured
  OpenAI-compatible endpoint.
- Never commit a real API key, and never paste one into a public issue.
- Do not route keys through an untrusted public CORS proxy.

## Generated tools

Generated HTML runs in an iframe with:

```text
sandbox="allow-scripts allow-forms allow-modals"
```

`allow-same-origin` is deliberately omitted. A restrictive no-network CSP is
injected into generated documents before previewing.

These protections reduce risk but do not make arbitrary model-generated code
safe for use outside the sandbox.

## Reporting a vulnerability

Please use the repository's **Security → Report a vulnerability** flow (GitHub
private security advisory) instead of opening a public issue with exploit details
or secrets. Include reproduction steps and affected files where possible.

This MVP does not provide a formal security-update SLA.
