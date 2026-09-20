const fs=require('fs');
const assert=require('assert');

const files=[
  'app-runtime.js',
  'context-auto.js',
  'keep-talking.js',
  'keep-talking-driver-househelp.js',
  'phrase-library.js',
  'phrase-library-expanded.js',
  'phrase-library-tier23-friction.js',
  'phrase-library-survival.js',
  'phrase-library-conversation.js',
  'phrase-library-driver-househelp.js',
  'index.html'
];

const dev=/[\u0900-\u097F]/u;
for(const file of files){
  const text=fs.readFileSync(file,'utf8');
  assert(!dev.test(text),`${file} contains Devanagari script`);
}

const runtime=fs.readFileSync('app-runtime.js','utf8');
for(const required of [
  'ABSOLUTE SCRIPT RULE',
  'NEVER output Devanagari',
  'containsDevanagariDeep',
  'cleanStoredList',
  'STRICT RETRY',
  'Roman-script safety check'
]) assert(runtime.includes(required),`Roman-only runtime guard missing: ${required}`);

console.log('Roman-only contract PASS: no Devanagari in app-facing source, generation guard + cache cleanup present');
