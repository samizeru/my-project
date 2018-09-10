
const { pool, sql } = require('../sql');
const kue = require('kue');  

redisConfig = {
    prefix: 'q',
    redis: 'redis://MT:RedisMonitorTech@redis-13787.c16.us-east-1-2.ec2.cloud.redislabs.com:13787',
    options: {no_ready_check: false},
    db:null
  };

const queue = kue.createQueue(redisConfig);

queue.watchStuckJobs(30);

queue.on('connect', () => {
  // If you need to
  console.info('Queue is ready!');
});

queue.on('error', (err) => {
  // handle connection errors here
  console.error('There was an error in the main queue!');
  console.error('REDIS_URL', process.env.REDIS_URL);
  console.error(err);
  console.error(err.stack);
});

module.exports = queue;
