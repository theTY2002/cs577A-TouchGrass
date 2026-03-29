# cs577A-TouchGrass

## Database Setup

This project uses **PostgreSQL in Docker** for the shared local database environment.

The goal is simple:
- everyone runs the same PostgreSQL version
- everyone uses the same database setup steps
- backend can connect to the same local DB structure

---

## What is already included in this repo

These files are already provided:

- `docker-compose.yml`
- `.env.example`
- `.gitignore`

These files are used to start PostgreSQL locally with Docker.

---

## What you need before starting

### 1. Install Docker Desktop
Make sure Docker Desktop is installed and running.

You can check by running:

```bash
docker --version
docker compose version


---


local setup


Step 1. Download or clone this repo to your computer

You need a local copy of the repo on your machine.

---

Step 2. Open the project root folder

Make sure you are inside the main project folder.

You should be able to see files like:

docker-compose.yml

.env.example

---

Step 3. Create a local .env file

Copy .env.example and rename the copy to .env.

After this step, both files should exist in the project root:

.env.example

.env

Important:

.env.example is the shared template

.env is your local file

do not commit .env

---

Step 4. Start PostgreSQL with Docker

In the project root, run:

docker compose up -d

This starts the PostgreSQL container in the background.

---


Step 5. Check that the container is running

Run:

docker ps

You should see a running container named:

team_postgres

If you see it, the database container started successfully.

---

Step 6. Test the database connection

Run:

docker exec -it team_postgres psql -U appuser -d appdb

If successful, you should enter the PostgreSQL shell and see:

appdb=#

This confirms that:

Docker is working

PostgreSQL is running

the database was created correctly

the local credentials are working

---

Environment variables：

The shared template is in .env.example.

Default values:

DB_PORT=5432

POSTGRES_DB=appdb

POSTGRES_USER=appuser

POSTGRES_PASSWORD=apppassword

If port 5432 is already being used on your machine, update your local .env file.
