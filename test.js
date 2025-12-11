const { PassThrough } = require('stream')

const readhead = new PassThrough({});
const getchar = (n) => readhead.read(n || 1);

//process.stdin.on('readable', () => {
  process.stdin.pipe(readhead);
//})

readhead.on('readable', () => {
  let chunk;
  while (null !== (chunk = getchar())) {
    console.log(`Received ${chunk} bytes of data.`);
  }
});
