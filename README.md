# ambient-channels

Long-form ambient music channels for top-tier YouTube audiences, run by several Claude
sessions working in parallel.

- **Start here (agents):** [`AGENTS.md`](AGENTS.md) → your role file in [`agents/`](agents/)
- **Live state:** [`STATUS.md`](STATUS.md) (rebuilt by CI on every push and every tracking run)
- **Channels:** [`channels/fantasy`](channels/fantasy/CHANNEL.md) · [`channels/worship`](channels/worship/CHANNEL.md)
- **Pilots:** F1–F3, W1–W3 in `channels/*/pilots/`, cards in `production/cards/`
- **Quality gates:** [`docs/gates.md`](docs/gates.md) · **Pipeline:** [`docs/pipeline.md`](docs/pipeline.md)
- **Tracking & APIs:** [`docs/apis.md`](docs/apis.md) — GitHub Actions `track` runs every 6 h
- **Dashboard:** Claude artifact, see [`dashboard/README.md`](dashboard/README.md)

## Running several sessions

Open one Claude session per role and give it this first message:

```
You are the <ROLE> session for the ambient-channels repo. Clone it, read AGENTS.md,
and follow the start-of-session protocol with AGENT_ROLE=<ROLE>.
```

Roles: `orchestrator` (one), `channel-fantasy`, `channel-worship`. Sessions coordinate only
through git: leases on cards, one status file per role, and STATUS.md.
