# opendbcli

A database CLI that truly opens your database to agents.

Give an agent a real database connection, and it can inspect schema, understand tables, and query the data layer directly.

## Why opendbcli?

Tools like `psql` are built for humans managing databases.\
opendbcli is built for agents that need to **understand and use a database as part of their workflow**.

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
npm install -g @luckymingxuan/opendbcli
```

---

### Commands

The CLI is designed for agent-readable database access.

<img width="611" height="327" alt="Image" src="https://github.com/user-attachments/assets/7e809478-0366-4bb4-9ff5-6821ae989d63" />


```bash
opendbcli connect "postgresql://postgres:password@localhost:5432/mydb"
opendbcli --status
opendbcli tables mydb
opendbcli describe mydb users
opendbcli query mydb "SELECT * FROM users"
```

### Example AI-driven Workflow

```bash
opendbcli connect "postgresql://postgres:password@localhost:5432/notesdb"
opendbcli describe notesdb notes
opendbcli query notesdb "CREATE TABLE notes (id SERIAL PRIMARY KEY, content TEXT)"
opendbcli query notesdb "INSERT INTO notes (content) VALUES ('hello world')"
opendbcli query notesdb "SELECT * FROM notes"
```

---

## Configuration

The connections are stored in:

```bash
~/.opendbcli/connections.json
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
