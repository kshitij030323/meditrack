import { query } from '@/lib/db';
import { requireActor, route } from '@/lib/api';

/** Catalog introspection (pg_catalog) for the DB Lab page. */
export const GET = route(async () => {
  await requireActor('admin');
  const [tables, views, routines, triggers, indexes, constraints, extensions] = await Promise.all([
    query(`
      SELECT c.relname AS name,
             pg_total_relation_size(c.oid) AS bytes,
             (xpath('/row/cnt/text()',
                    query_to_xml(format('SELECT count(*) AS cnt FROM %I', c.relname), false, true, '')))[1]::TEXT::INT AS row_count,
             obj_description(c.oid) AS comment
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relkind = 'r'
       ORDER BY c.relname`),
    query(`
      SELECT viewname AS name, 'view' AS kind, definition FROM pg_views WHERE schemaname = 'public'
      UNION ALL
      SELECT matviewname, 'materialized view', definition FROM pg_matviews WHERE schemaname = 'public'
      ORDER BY kind DESC, name`),
    query(`
      SELECT p.proname AS name,
             CASE WHEN p.prokind = 'p' THEN 'procedure'
                  WHEN p.prorettype = 'trigger'::REGTYPE THEN 'trigger function'
                  ELSE 'function' END AS kind,
             pg_get_function_identity_arguments(p.oid) AS args,
             l.lanname AS language,
             pg_get_functiondef(p.oid) AS definition
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        JOIN pg_language l ON l.oid = p.prolang
       WHERE n.nspname = 'public'
         AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
       ORDER BY kind, name`),
    query(`
      SELECT t.tgname AS name, c.relname AS table_name, p.proname AS function_name,
             pg_get_triggerdef(t.oid) AS definition
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_proc p ON p.oid = t.tgfoid
       WHERE NOT t.tgisinternal
       ORDER BY c.relname, t.tgname`),
    query(`
      SELECT i.indexname AS name, i.tablename AS table_name, am.amname AS method,
             pg_relation_size(c.oid) AS bytes, i.indexdef AS definition
        FROM pg_indexes i
        JOIN pg_class c ON c.relname = i.indexname
        JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = i.schemaname
        JOIN pg_am am ON am.oid = c.relam
       WHERE i.schemaname = 'public'
       ORDER BY i.tablename, i.indexname`),
    query(`
      SELECT con.conname AS name, rel.relname AS table_name,
             CASE con.contype WHEN 'p' THEN 'PRIMARY KEY' WHEN 'f' THEN 'FOREIGN KEY'
                              WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK' ELSE con.contype::TEXT END AS type,
             pg_get_constraintdef(con.oid) AS definition
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace n ON n.oid = rel.relnamespace
       WHERE n.nspname = 'public'
       ORDER BY rel.relname, type, con.conname`),
    query(`SELECT extname AS name, extversion AS version FROM pg_extension ORDER BY extname`),
  ]);
  return { tables, views, routines, triggers, indexes, constraints, extensions };
});
