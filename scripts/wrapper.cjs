const runSeed = require('../scripts/runSeed.cjs');
runSeed().then(() => {
  console.log('SEEDING_COMPLETED');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
setInterval(() => {}, 1000); // Keep alive just in case
