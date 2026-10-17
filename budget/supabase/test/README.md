# Tests de sécurité (RLS)

Simulent Supabase (schéma `auth`, rôles `anon` / `authenticated`) sur un PostgreSQL local, puis tentent de contourner la sécurité.

```bash
createdb budget_test
psql -d budget_test -v ON_ERROR_STOP=1 -f 00-supabase-mock.sql
psql -d budget_test -v ON_ERROR_STOP=1 -f ../schema.sql
psql -d budget_test -f 10-rls-test.sql
```

Le dernier fichier doit afficher « FIN : tous les tests sont passés ».
