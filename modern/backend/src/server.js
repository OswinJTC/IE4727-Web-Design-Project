import { createApp } from './app.js';
import { config } from './config.js';
import { createPool } from './db.js';

const app = createApp({ pool: createPool(), sessionSecret: config.sessionSecret });
app.listen(config.port, '127.0.0.1', () => {
  console.log(`FoodHub API on http://127.0.0.1:${config.port} (database ${config.db.database})`);
});
