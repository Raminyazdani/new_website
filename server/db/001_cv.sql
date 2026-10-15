BEGIN;
CREATE SCHEMA IF NOT EXISTS hero_lab;
CREATE TABLE IF NOT EXISTS hero_lab.cv_documents (
  owner_id text NOT NULL,
  document_key text NOT NULL,
  document jsonb NOT NULL CHECK (jsonb_typeof(document) = 'object'),
  source_sha256 char(64) NOT NULL,
  revision integer NOT NULL CHECK (revision > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_id, document_key)
);
CREATE TABLE IF NOT EXISTS hero_lab.cv_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id text NOT NULL,
  idempotency_key text NOT NULL,
  source_sha256 char(64) NOT NULL,
  revision integer NOT NULL,
  scope text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, idempotency_key)
);
CREATE OR REPLACE FUNCTION hero_lab.reject_audit_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'CV audit is append-only'; END;
$$;
DROP TRIGGER IF EXISTS cv_audit_append_only ON hero_lab.cv_audit;
CREATE TRIGGER cv_audit_append_only BEFORE UPDATE OR DELETE ON hero_lab.cv_audit FOR EACH ROW EXECUTE FUNCTION hero_lab.reject_audit_change();
COMMIT;
