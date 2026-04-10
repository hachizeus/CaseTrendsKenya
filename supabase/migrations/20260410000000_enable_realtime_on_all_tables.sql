-- Enable all existing non-system tables in the supabase_realtime publication.
-- Supabase Postgres changes use the publication named `supabase_realtime`.
-- This migration will add every ordinary table in non-system schemas
-- to that publication if it is not already included.

DO $$
DECLARE
  table_row RECORD;
BEGIN
  FOR table_row IN
    SELECT nsp.nspname AS schema_name,
           cls.relname AS table_name
    FROM pg_class cls
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
    WHERE cls.relkind = 'r' -- ordinary tables
      AND nsp.nspname NOT IN ('pg_catalog', 'information_schema')
      AND cls.relname NOT LIKE 'pg_%'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_publication_rel pr
        JOIN pg_class rel ON pr.prrelid = rel.oid
        JOIN pg_namespace ns ON rel.relnamespace = ns.oid
        JOIN pg_publication pub ON pr.prpubid = pub.oid
        WHERE pub.pubname = 'supabase_realtime'
          AND ns.nspname = nsp.nspname
          AND rel.relname = cls.relname
      )
  LOOP
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I.%I;',
                   table_row.schema_name,
                   table_row.table_name);
  END LOOP;
END$$;
