# dbcli Skill

Use this skill when you need to inspect database structure and run SQL through `dbcli`.

## Typical Workflow

1. Check available connections:
   `dbcli --status`
2. List tables:
   `dbcli tables <db-name>`
3. Inspect one table:
   `dbcli schema <db-name> <table>`
4. Find related tables:
   `dbcli related <db-name> <table>`
5. Execute SQL:
   `dbcli query <db-name> "<sql>"`

## Notes

- Database support: PostgreSQL
- Connection setup:
  `dbcli connect "postgresql://user:password@host:5432/database"`
