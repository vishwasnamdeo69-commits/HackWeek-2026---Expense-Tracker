# LedgerFlow

A polished client-side expense tracker built for HackWeek 2026, now packaged as a production-ready Docker deployment.

## Project Overview

LedgerFlow is a lightweight personal finance dashboard that runs entirely in the browser. It supports expense tracking, monthly budgeting, search/filter/sort, and live analytics charts without requiring a backend.

This repository now includes a Docker-ready deployment using Nginx, runtime configuration via `.env`, and a `docker-compose.yml` workflow so the app can be launched with a single command.

## Features

- Expense add/edit/delete with validation and inline feedback
- Monthly budgeting with live status and alerts
- Search, filter, and sort for transaction data
- Live charts powered by Chart.js
- LocalStorage persistence for browser-only data storage
- Lightweight static asset delivery with Nginx
- Runtime configuration support through a generated JS config file

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript (ES Modules)
- Chart.js
- Nginx
- Docker
- Docker Compose

## Folder Structure

```
ExpenseTracker/
├── assets/                # static images, icons, illustrations
├── css/                   # stylesheet modules
├── js/                    # application JavaScript modules
│   ├── config.js          # runtime config entry point
│   ├── app.js
│   ├── analytics.js
│   ├── budget.js
│   ├── charts.js
│   ├── constants.js
│   ├── expenses.js
│   ├── filters.js
│   ├── renderer.js
│   ├── state.js
│   ├── storage.js
│   └── utils.js
├── index.html
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── docker-entrypoint.sh
├── .dockerignore
├── .env.example
├── README.md
└── LICENSE
```

## Docker Architecture

The application is served as a static site using `nginx:alpine`, a lightweight production-grade web server. At container startup, `docker-entrypoint.sh` generates `js/config.js` from environment variables, then launches Nginx.

The `docker-compose.yml` file builds the image, maps the host port to the container, and passes runtime environment variables from `.env`.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| APP_NAME | The public name of the application | LedgerFlow |
| APP_VERSION | Application version displayed in the footer | 1.0.0 |
| APP_THEME | Runtime theme identifier for future styling | dark |
| APP_PORT | Host port exposed by Docker Compose | 8080 |

## Build Instructions

Build the Docker image locally:

```bash
docker build -t ledgerflow .
```

## Run Instructions

Run the container directly:

```bash
docker run --rm -p 8080:80 -e APP_NAME=LedgerFlow -e APP_VERSION=1.0.0 ledgerflow
```

Then visit `http://localhost:8080`.

## Docker Compose

Start the application with Docker Compose:

```bash
docker compose up --build
```

The application will be available at `http://localhost:8080` by default.

## Environment Variables

The `.env` file is used to configure runtime settings without changing source files.

- `APP_NAME`: Application branding shown in the title and header.
- `APP_VERSION`: Version label shown in the footer.
- `APP_THEME`: Runtime theme value consumed by the frontend (dark by default).
- `APP_PORT`: Port used for Docker Compose mapping.

Copy `.env.example` to `.env` and adjust values as needed.

## Stopping Containers

Stop Docker Compose containers:

```bash
docker compose down
```

If you ran a container directly, stop it with `Ctrl+C` or:

```bash
docker ps
docker stop <container-id>
```

## Cleaning Containers

Remove stopped containers and unused images:

```bash
docker compose down --rmi local
```

Clean up dangling images:

```bash
docker image prune -f
```

## Troubleshooting

- If the app does not load, verify Docker is running and the container is healthy.
- Confirm `.env` variables are set correctly, then rebuild if needed.
- If static assets are missing, check that `index.html` references `css/` and `js/` paths correctly.

## License

This project is licensed under the MIT License. See `LICENSE` for details.

## Screenshots Placeholder

![](screenshots/dashboard.png)

If screenshots are unavailable, replace the placeholder with live captures from the running app.
