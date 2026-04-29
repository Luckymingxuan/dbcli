# dbcli

A database CLI that truly opens your database to agents.

Give an agent a real database connection, and it can inspect schema, understand tables, and query the data layer directly.

## Why dbcli?

Tools like `psql` are built for humans managing databases.\
dbcli is built for agents that need to **understand and use a database as part of their workflow**.

- Agents can inspect tables and schema directly
- Agents can query the database without human-oriented wrappers
- Agents get closer to the real data layer instead of an abstracted API

The goal is simple: help agents understand the database, and make the database truly open to them.

## Database Support

Currently supports **PostgreSQL only**.

This is a deliberate choice: focus on one solid foundation for agent-native database workflows.

## Quick Start

### Install

```bash
npm install -g @luckymingxuan/dbcli
```

---

### Commands

The CLI is designed for agent-readable database access.

<img width="611" height="327" alt="Image" src="https://github.com/user-attachments/assets/7e809478-0366-4bb4-9ff5-6821ae989d63" />


```bash
dbcli connect "postgresql://postgres:password@localhost:5432/mydb"
dbcli --status
dbcli tables mydb
dbcli describe mydb users
dbcli query mydb "SELECT * FROM users"
```

### Example AI-driven Workflow

```bash
dbcli connect "postgresql://postgres:password@localhost:5432/notesdb"
dbcli describe notesdb notes
dbcli query notesdb "CREATE TABLE notes (id SERIAL PRIMARY KEY, content TEXT)"
dbcli query notesdb "INSERT INTO notes (content) VALUES ('hello world')"
dbcli query notesdb "SELECT * FROM notes"
```

---

## Configuration

The connections are stored in:

```bash
~/.dbcli/connections.json
```

Example configuration:

```bash
{
  "mydb": {
    "url": "postgresql://localhost:5432/mydb",
    "database": "mydb",
    "host": "localhost",
    "port": 5432,
    "username": "postgres",
    "password": "password",
    "lastConnected": "2026-04-26T09:00:00.000Z"
  }
}
```

## License

MIT
