const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    const r = await p.pushSubscription.findFirst({ where: { deviceId: 'c4670481-2702-4057-a8cd-ed9993be1e37' } });
    console.log(JSON.stringify(r, null, 2));
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await p.$disconnect();
  }
})();

