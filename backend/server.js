const fastify = require('fastify')({ logger: true });

fastify.get('/status', async (request, reply) => {
  reply.code(200).send({ status: 'ok' });
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
