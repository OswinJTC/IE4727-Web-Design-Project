// Environment with the XAMPP defaults the PHP app uses (traditional/includes/config.php)
export const config = {
  db: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASS ?? '',
    database: process.env.DB_NAME ?? 'foodhub',
  },
  port: Number(process.env.PORT ?? 3001),
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-only-change-me',
};
