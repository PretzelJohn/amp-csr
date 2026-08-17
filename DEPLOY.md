# OCI deployment notes

## Required GitHub Actions secrets

Add these secrets in GitHub:

- `OCI_HOST`
- `OCI_USERNAME`
- `OCI_SSH_KEY`
- `DATABASE_URL`
- `DEFAULT_USER_PASSWORD`
- `JWT_SECRET`

## OCI VM setup

1. Install Node.js 22 and pnpm.
2. Install nginx and certbot.
3. Create the app directories:

```bash
sudo mkdir -p /var/www/amp.lucashussey.com/{current,releases,shared,www}
sudo chown -R ubuntu:ubuntu /var/www/amp.lucashussey.com
```

4. Install the API service:

```bash
sudo cp deploy/systemd/amp-api.service /etc/systemd/system/amp-api.service
sudo systemctl daemon-reload
sudo systemctl enable amp-api
```

5. Install the nginx site config:

```bash
sudo cp deploy/nginx/amp.lucashussey.com.conf /etc/nginx/sites-available/amp.lucashussey.com.conf
sudo ln -sf /etc/nginx/sites-available/amp.lucashussey.com.conf /etc/nginx/sites-enabled/amp.lucashussey.com.conf
sudo nginx -t
sudo systemctl reload nginx
```

6. Issue TLS certs:

```bash
sudo certbot --nginx -d amp.lucashussey.com -d www.amp.lucashussey.com
```

## Deploy flow

Push to `main` and the GitHub Action deploys the repo to the OCI VM, builds the frontend and backend, writes `.env` from secrets, restarts the API, and reloads nginx.
