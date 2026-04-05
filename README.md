<!--
 * @Author: Mingxuan songmingxuan936@gmail.com
 * @Date: 2026-04-05 17:01:59
 * @LastEditors: Mingxuan songmingxuan936@gmail.com
 * @LastEditTime: 2026-04-05 22:24:41
 * @FilePath: /dbcli/README.md
 * @Description: 
 * 
 * Copyright (c) 2026 by ${git_name_email}, All Rights Reserved. 
-->
# dbcli

A personal database CLI tool for PostgreSQL with AI-friendly design.

## Install

```bash
npm install -g @luckymingxuan/dbcli
```

## Commands

### Connection Management

```bash
# Connect to database
dbcli connect <db-name|url>                    # Connect using stored credentials
dbcli connect <url> -u <user> -p <pass>        # Connect with inline credentials
dbcli connect <db-name> -c                     # Use credentials from current connection

# Show all saved connections
dbcli -s
dbcli --status

# Disconnect (keeps credentials)
dbcli disconnect <db-name>

# Logout (clears credentials only)
dbcli logout <db-name>

# Delete connection completely
dbcli delete <db-name>
```

### Database Operations

```bash
# List all tables
dbcli tables

# Show table structure
dbcli describe <table>

# Execute SQL query
dbcli query "<sql>"
```

## Configuration

Connections are stored in `~/.dbcli/connections.json` with the following structure:

```json
{
  "connections": {
    "my-db": {
      "url": "postgresql://user:pass@host:5432/db",
      "username": "user",
      "password": "pass",
      "enabled": true
    }
  }
}
```

## License

MIT