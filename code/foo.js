const buffer = [];
process.stdin.on('data', (data) => {
  buffer.push(data.toString('utf8'));
})

process.stdin.on('end', () => {
  buffer.join('')
    .split('\n')
    .map(line => {
      const top = line.split(':')
      const current = top[0];
      if(!top[1]) process.exit(0);
      const slicePoint = top[1].indexOf('require(') + 8;
      let dep = top[1].slice(slicePoint)
        .split(')')[0];
      if(dep.indexOf('./') === 1) dep = dep.slice(0,dep.length-1) + ".js'"
      process.stdout.write(`'./${current}' --> ${dep}\n`);
    })
})
