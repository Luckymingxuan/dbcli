---
name: dbcli
description: Use this skill when the user needs to inspect PostgreSQL tables, understand table relationships, or run SQL through dbcli.
---

# dbcli Skill

Use this skill to work with PostgreSQL via `dbcli` commands.

## When To Use

- The user asks to inspect database tables/columns.
- The user needs related tables before writing joins.
- The user wants SQL execution through a saved database connection.

## Constraints

- Database support is PostgreSQL only.
- `connect` requires a full URL with username and password.
- Commands use `<db-name>` as the saved connection key (database name parsed from URL path).

## Command Guide

### 1) `dbcli --status`
- Purpose: list all saved connections.
- Use when: before any task, to confirm the connection exists.
- Output: JSON summary with `name`, `host`, `port`, and `last_connected`.

### 2) `dbcli connect "<postgresql-url>"`
- Purpose: create or update a saved connection by database name.
- Required format:
  `postgresql://user:password@host:5432/database`
- Notes:
  - Username and password must be present in URL.
  - Saved file is `~/.dbcli/connections.json`.

### 3) `dbcli tables <db-name>`
- Purpose: list all tables in the target database.
- Use when: first schema discovery step.
- Output: JSON with `table_count` and table list (`schema`, `name`).

### 4) `dbcli schema <db-name> <table>`
- Purpose: show compact DDL-like structure for one table.
- Use when: quick understanding for SQL writing.
- Output: `CREATE TABLE` style text with column types, nullability, defaults, and inline `REFERENCES` when foreign keys exist.

### 5) `dbcli describe <db-name> <table>`
- Purpose: show detailed column metadata in JSON.
- Use when: you need machine-friendly fields or precise column attributes.
- Output fields per column: `name`, `type`, `nullable`, `default`, `description`.

### 6) `dbcli related <db-name> <table>`
- Purpose: find directly related tables for one table.
- Use when: preparing joins or understanding dependencies.
- Output:
  - `outgoing_related_tables`: current table references these tables.
  - `incoming_related_tables`: these tables reference current table.
  - counts for each direction.

### 7) `dbcli query <db-name> "<sql>"`
- Purpose: execute SQL directly.
- Use when: after schema/relationship checks, run read or write SQL.
- Output:
  - Row table for queries returning rows.
  - Row count summary for non-result statements.

## Recommended Execution Order

1. `dbcli --status`
2. `dbcli tables <db-name>`
3. `dbcli schema <db-name> <table>` and/or `dbcli describe <db-name> <table>`
4. `dbcli related <db-name> <table>` if multi-table logic is needed
5. `dbcli query <db-name> "<sql>"`

## Example A: Understand an Unknown Table

Goal: learn `users` table before writing SQL.

```bash
dbcli --status
dbcli tables mydb
dbcli schema mydb users
dbcli describe mydb users
dbcli related mydb users
```

Expected result:
- You know columns and types.
- You know foreign-key directions.
- You can safely write joins.

## Example B: Relationship-Driven Query

Goal: query user preferences with user identity.

```bash
dbcli related mydb user_preferences
dbcli query mydb "SELECT up.*, u.email FROM user_preferences up JOIN users u ON up.user_id = u.id LIMIT 20"
```

Expected result:
- `related` confirms whether `user_preferences -> users` exists.
- Query returns combined rows only after relationship validation.

## Common Recovery

- `Connection "<db-name>" not found`:
  run `dbcli --status`; if missing, run `dbcli connect ...`.
- `missing username or password in URL`:
  fix URL format and reconnect.
- `Table "<table>" not found`:
  run `dbcli tables <db-name>` and use exact table name.
