const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

global.window={};
for(const f of ['phrase-library.js','phrase-library-expanded.js','phrase-library-tier23-friction.js','phrase-library-survival.js','phrase-library-conversation.js','phrase-library-driver-househelp.js']) vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const search=require('../library-search.js');
const lib=window.BOLNA_PHRASE_LIBRARY;

assert.strictEqual(search.rank(lib,'quantum submarine accordion','All').length,0,'nonsense query should produce no library matches');
for(const q of ['mall distance walking','maid coming today','driver petrol pump','cook less oil','groceries running out']){
  assert(search.rank(lib,q,'All').length>0,`real expat query should still match: ${q}`);
}
console.log('Library no-match confidence regression PASS');
