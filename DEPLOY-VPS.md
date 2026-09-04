# Deploy XPI BD Intelligence to the VPS (alongside XPI Schedule)

Target: **bd.xpisolutions.com** on the Hostinger VPS `45.82.72.36`.
Safe by design — runs in its own Docker project in `/opt/xpi-bd`, binds only to the
Docker bridge `172.18.0.1:3200`, and is exposed through the **existing Caddy**. It never
touches `/opt/xpi-schedule` or Schedule's ports.

Ports: Schedule=3000 (internal), BD=**3200** (bridge). Caddy owns 80/443.

---

## Step 1 — DNS (Hostinger panel)  ⟵ you
Add an A record:  `A   bd   45.82.72.36`  (TTL default). Save. It may take a few minutes.

## Step 2 — Get the code onto the VPS  ⟵ you (browser terminal, as root)
```bash
cd /opt
git clone <YOUR_GITHUB_REPO_URL> xpi-bd
cd xpi-bd
```

## Step 3 — Create the .env with your keys  ⟵ you
Paste this, replacing the two keys with your real ones, then Enter:
```bash
cat > /opt/xpi-bd/.env <<'EOF'
ANTHROPIC_API_KEY=sk-ant-PASTE_YOURS
SERPER_API_KEY=PASTE_YOURS
BD_MODEL=claude-haiku-4-5
EXTRACT_MODEL=claude-haiku-4-5
BD_PROFILE=xpi
PORT=3000
EOF
chmod 600 /opt/xpi-bd/.env
```

## Step 4 — Build & start (Docker)  ⟵ you
```bash
cd /opt/xpi-bd
docker compose -f compose.vps.yml up -d --build
docker logs xpi-bd --tail 20        # should show: Claude key loaded ✓, Search key loaded ✓
curl -s http://172.18.0.1:3200/api/health   # should return JSON with "anthropicKey":true
```

## Step 5 — Expose it through Caddy  ⟵ you
Append the BD block to the SAME Caddyfile Schedule uses (do not edit existing lines):
```bash
cat >> /opt/xpi-schedule/caddy/Caddyfile <<'EOF'

bd.xpisolutions.com {
    encode gzip
    reverse_proxy 172.18.0.1:3200
}
EOF
```
Validate + reload with NO downtime for Schedule:
```bash
docker exec xpi-schedule-caddy-1 caddy validate --config /etc/caddy/Caddyfile
docker exec xpi-schedule-caddy-1 caddy reload   --config /etc/caddy/Caddyfile
```

## Step 6 — Verify  ⟵ you
```bash
# BD is live (HTTPS cert issues within ~a minute of DNS resolving):
curl -s -o /dev/null -w "BD %{http_code}\n" https://bd.xpisolutions.com
# Schedule is UNAFFECTED:
curl -s -o /dev/null -w "Schedule %{http_code}\n" https://schedule.xpisolutions.com/api/health/ready
```
Then open **https://bd.xpisolutions.com** in a browser. Done.

## Step 7 — (optional) add BD to the monitor
Edit `/opt/xpi-schedule/monitor/pulse.sh`, append `bd.xpisolutions.com` to the
`PORTFOLIO` variable. Do NOT add a second cron job.

---

## Updating later (after code changes)
```bash
cd /opt/xpi-bd && git pull && docker compose -f compose.vps.yml up -d --build
```

## The white-label CORE app (second subdomain, optional)
1. DNS: `A  bdcore  45.82.72.36`
2. In `compose.vps.yml`, uncomment the `xpi-bd-core` service (port 3201).
3. `docker compose -f compose.vps.yml up -d --build`
4. Add a Caddy block for `bdcore.xpisolutions.com` → `172.18.0.1:3201`, validate + reload.

## Housekeeping
After heavy rebuilds: `docker system df` and, if the build cache is large,
`docker builder prune -af`.
