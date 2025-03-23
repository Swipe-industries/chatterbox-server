# chatterbox-server

You can directly apply changes to your database using the drizzle-kit push command. This is a convenient method for quickly testing new schema designs or modifications in a local development environment, allowing for rapid iterations without the need to manage migration files:

```bash
npx drizzle-kit push
```

Alternatively, you can generate migrations using the drizzle-kit generate command and then apply them using the drizzle-kit migrate command:

Generate migrations:
```bash
npx drizzle-kit generate
```

Apply migrations:
```bash
npx drizzle-kit migrate
```