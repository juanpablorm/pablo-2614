import { createApp } from './app.js';
import { loadEnv } from './config/env.js';

let env;
try {
  env = loadEnv();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

createApp(env).listen(env.PORT, () => {
  console.log(`SnailRacer API escuchando en http://localhost:${env.PORT}`);
});
