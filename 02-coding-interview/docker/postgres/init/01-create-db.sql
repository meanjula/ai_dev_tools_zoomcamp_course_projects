-- Create admin DB and any other DBs the app needs
CREATE DATABASE  anjula;
-- Optional: create a role and grant privileges
DO
$$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anjula') THEN
    CREATE ROLE anjula LOGIN PASSWORD 'timsina';
  END IF;
END
$$;
GRANT ALL PRIVILEGES ON DATABASE anjula TO anjula;