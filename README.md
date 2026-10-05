# drp-front

> Front-end shell: packages the domain UIs

Part of the **SpaceHub (Distributed Reservation Platform)** distributed system — team `distributed-reservation-platform`, Grupo 1.
Governance and documentation live in [`drp-docs`](https://github.com/code-corhuila/drp-docs).

## How to run (Corte 2)

```bash
npm install
npm start
```

The shell listens on **http://localhost:4200**. Default data mode is `failover` (`src/environments/environment.ts`): the client calls the gateway at `http://localhost:8080` and, on network error or 5xx, keeps working with **synthetic fixtures** that match the 07-api envelopes (`{data, meta}`, `{error, message, details?, traceId}`, money as `amountCents`, reservation states `PAYMENT_PENDING | CONFIRMED | CANCELLED`).

Synthetic accounts:

- `member@spacehub.local` / `Spacehub1!` (USER · Ana Reserva)
- `admin@spacehub.local` / `Spacehub1!` (ADMIN)

If the banner **Datos sintéticos — contrato 07-api; gateway no disponible** is visible, the UI is serving those fixtures. That is expected when the gateway is down; Corte 2 grades what the client sees.

`DATA_MODE` knobs are documented in `.env.example`. Change `environment.mode` to `synthetic` (fixtures only) or `live` (HTTP only).

## Branching

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/...  hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another: `merge develop -> qa` and `merge qa -> main` do not exist in this model.

`main` requires **1 approval from `ariel5253`**. On `develop` and `qa` the team sets its own review
rule.

Full policy: `00-governance/branching-policy.md` in `drp-docs`.

## Native Federation (later)

Domain portals (`drp-*-portal`) will be extracted later. The Corte 2 demo lives in this shell so the client can click the full USER flow (login → search → reserve → pay → inbox) without remotes.
