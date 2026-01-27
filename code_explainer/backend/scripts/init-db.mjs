import { initDB } from '../db/index.js';

(async ()=>{
  try {
    await initDB();
    console.log('Schema initialized');
    process.exit(0);
  } catch (err) {
    console.error('Init DB failed', err);
    process.exit(1);
  }
})();
