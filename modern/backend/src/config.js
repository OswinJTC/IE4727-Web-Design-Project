// The only setting read from the environment is DATABASE_URL (the Supabase Postgres connection string, in .env)
export const config = {
  databaseUrl: process.env.DATABASE_URL,
  port: 3001,
  sessionSecret: 'dev-only-change-me',
};
