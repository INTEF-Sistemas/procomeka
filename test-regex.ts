const t = `All files              |  100.00 |  100.00 |`;
const r = /All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/;
console.log(t.match(r));
