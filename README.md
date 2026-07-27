# Frontend of SigmaDojo

## Requirements

1. node, npm, react, vite
2. Please don't install those in your bare metal, due to the npm worm
3. Docker

## Overview

The app uses Monaco editor for the yaml builder, and calls the sigmadojo backend API to validate, execute, etc.

## Setup

App is only compatible for running on nginx with the given nginx.conf in the [Dockerfile](./Dockerfile) (after building it). Do not `npm run dev`. 

### Env var

1. `cp sample.env .env`
2. Edit `.env`

### Docker run for debugging

For using npm and other things.

```bash
docker run -it --rm --user "$(id -u):$(id -g)" -v "$PWD:/app" -w /app node:24.13.0-bookworm /bin/bash
```

## Testing

```bash
# build
docker compose -f docker-compose-testing.yaml up --build -d
# destroy
docker compose -f docker-compose-testing.yaml down
```

## Production

This is also available as a docker image

### Pull

```bash
docker pull shobanchiddarth/sigmadojo-frontend:latest
```

### Run

```bash
docker run -d -p 127.0.0.1:3000:80 -e VITE_BACKEND_URL=<backend_url> shobanchiddarth/sigmadojo-frontend:latest
```
