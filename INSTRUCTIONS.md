# Deployment Instructions (GitLab CI + SSH Server)

This file explains exactly what to do:
1. in GitLab
2. on the target server

It is aligned with the current files:
- `.gitlab-ci.yml`
- `Dockerfile`

---

## 1) What to do on the server

Run these steps on your Linux server (Ubuntu/Debian examples).

### 1.1 Create a deploy user (recommended)

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
```

### 1.2 Install Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 1.3 Allow deploy user to run Docker

```bash
sudo usermod -aG docker deploy
```

Log out and back in (or `newgrp docker`) so group changes apply.

### 1.4 Create SSH key auth for CI

On your local machine (or secure admin machine), generate a key pair dedicated to GitLab CI:

```bash
ssh-keygen -t ed25519 -C "gitlab-ci-deploy" -f ~/.ssh/gitlab_ci_deploy
```

Copy the public key to server user `deploy`:

```bash
ssh-copy-id -i ~/.ssh/gitlab_ci_deploy.pub deploy@YOUR_SERVER_IP
```

If `ssh-copy-id` is unavailable, append manually:

```bash
cat ~/.ssh/gitlab_ci_deploy.pub | ssh deploy@YOUR_SERVER_IP "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

### 1.5 Verify SSH + Docker access

```bash
ssh -i ~/.ssh/gitlab_ci_deploy deploy@YOUR_SERVER_IP "docker ps"
```

You should see Docker output (possibly empty list), not a permission error.

### 1.6 Open firewall for app port (default 3000)

If UFW is enabled:

```bash
sudo ufw allow 3000/tcp
sudo ufw status
```

---

## 2) What to do in GitLab

### 2.1 Push current project files

Ensure these files are committed:
- `.gitlab-ci.yml`
- `Dockerfile`
- `.dockerignore`

Then push to `main`.

### 2.2 Ensure a GitLab Runner exists

Your project needs a runner that can run Docker-in-Docker (`docker:dind`).

Required runner capability:
- Docker executor
- privileged mode enabled

If you use your own runner, in `config.toml` it typically needs:

```toml
[runners.docker]
  privileged = true
```

### 2.3 Add CI/CD variables

In GitLab:
- Open project
- Go to `Settings` -> `CI/CD` -> `Variables`
- Add these variables exactly:

1. `SSH_PRIVATE_KEY`
Value: content of `~/.ssh/gitlab_ci_deploy` (private key)
Flags: Masked + Protected

2. `SSH_KNOWN_HOSTS`
Get value from:

```bash
ssh-keyscan -p 22 YOUR_SERVER_IP
```

If your SSH port is custom, replace `22`.
Flags: Masked + Protected

3. `SSH_HOST`
Value: your server IP or DNS name
Flags: Protected

4. `SSH_USER`
Value: `deploy` (or your chosen user)
Flags: Protected

5. `SSH_PORT` (optional)
Value: e.g. `22`
Flags: Protected

6. `HOST_PORT` (optional)
Value: host port to expose, default is `3000`
Flags: Protected

### 2.4 Protect main branch (recommended)

Go to `Settings` -> `Repository` -> `Protected branches` and protect `main`.

The pipeline is configured to run only on `main`.

### 2.5 Trigger deployment

Push to `main`:

```bash
git add .
git commit -m "Setup container deployment"
git push origin main
```

GitLab pipeline stages will run:
1. `build`: build Docker image and save artifact
2. `deploy`: copy image to server via SSH, restart container

---

## 3) How deployment works

On deploy, CI executes these actions on server:
- `docker load < /tmp/ard-life-image.tar.gz`
- stop old container `ard-life` if exists
- remove old container `ard-life` if exists
- run new container:

```bash
docker run -d \
  --name ard-life \
  --restart unless-stopped \
  -p 3000:3000 \
  ard-life:latest
```

Container name: `ard-life`
Image name: `ard-life:latest`

---

## 4) Verify after deployment

### 4.1 Check pipeline in GitLab

`CI/CD` -> `Pipelines` -> latest pipeline should be green.

### 4.2 Check container on server

```bash
ssh deploy@YOUR_SERVER_IP "docker ps --filter name=ard-life"
```

### 4.3 Check logs

```bash
ssh deploy@YOUR_SERVER_IP "docker logs --tail 100 ard-life"
```

### 4.4 Check app endpoint

Open:
- `http://YOUR_SERVER_IP:3000`

---

## 5) Common issues and fixes

### `Permission denied (publickey)`
- Check `SSH_PRIVATE_KEY` value in GitLab
- Ensure matching public key is in server `~/.ssh/authorized_keys`
- Ensure `SSH_USER`, `SSH_HOST`, `SSH_PORT` are correct

### `docker: permission denied`
- Add deploy user to docker group:

```bash
sudo usermod -aG docker deploy
```

- Re-login user

### CI build job fails with dind errors
- Ensure runner is `privileged = true`
- Ensure runner supports Docker service containers

### Port already in use
- Change `HOST_PORT` variable in GitLab (for example `8080`)
- Then access app at `http://YOUR_SERVER_IP:8080`

---

## 6) Security recommendations

- Use a dedicated deploy user (non-root)
- Use dedicated SSH key for CI only
- Mark CI variables as Protected and Masked
- Restrict inbound firewall rules to required ports
- Consider placing app behind Nginx/Caddy with HTTPS
