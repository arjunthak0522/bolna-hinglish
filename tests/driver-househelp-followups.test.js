const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

global.window={};
for(const f of ['phrase-library.js','phrase-library-expanded.js','phrase-library-tier23-friction.js','phrase-library-survival.js','phrase-library-conversation.js','phrase-library-driver-househelp.js']) vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const search=require('../library-search.js');
vm.runInThisContext(fs.readFileSync('keep-talking.js','utf8'),{filename:'keep-talking.js'});
vm.runInThisContext(fs.readFileSync('keep-talking-driver-househelp.js','utf8'),{filename:'keep-talking-driver-househelp.js'});

const lib=window.BOLNA_PHRASE_LIBRARY;
const kt=window.BOLNA_KEEP_TALKING;
const norm=s=>String(s||'').trim().toLowerCase();
const out=s=>kt.resolveSuggestions(lib,search,s,'',3).map(x=>x.english);

const cases=[
  ['What time will you come?',['Please come at eight.','Please come ten minutes early.','Let me know when you are downstairs.']],
  ['Let me know when you are downstairs.',['Please wait near the entrance.','Please bring the car around.','I will message you when I am ready.']],
  ['Please stop at the petrol pump.',['Please fill the tank.','Please check the tyre pressure.','I transferred your payment.']],
  ['We have one more stop.',['First go to the pharmacy.','Please stop at the grocery store.','After that, go home.']],
  ['Are you coming today?',['What time are you coming today?','Please tell me if you are running late.','Please tell me in advance if you cannot come.']],
  ['Please sweep and mop the floor.',['Please use less water when mopping.','Please clean under the sofa.','Please clean under the bed.']],
  ['What are you cooking today?',['Please make dal, rice, and one vegetable.','Please use less oil.','Please make enough for dinner too.']],
  ['Please make dal, rice, and one vegetable.',['Please use less oil.','Please use less salt.','Please make it less spicy.']],
  ['Please make enough for dinner too.',['Please save the leftovers.','Please put the food in the fridge.','Please do not throw away the leftovers.']],
  ['What groceries are running low?',['Please make a grocery list.','Please tell me before something runs out.']]
];

for(const [src,expected] of cases){
  const got=out(src).map(norm);
  for(const phrase of expected) assert(got.includes(norm(phrase)),`${src}: missing ${phrase}; got ${got.join(' | ')}`);
  assert(new Set(got).size===got.length,`${src}: duplicate follow-up`);
  assert(!got.includes(norm(src)),`${src}: suggested itself`);
}

const rough=[
  ["driver what time coming",'Please come at eight.'],
  ['driver petrol pump','Please fill the tank.'],
  ['maid coming today','What time are you coming today?'],
  ['maid jhadu pocha','Please use less water when mopping.'],
  ['cook what today','Please make dal, rice, and one vegetable.'],
  ['groceries running out','Please make a grocery list.']
];
for(const [src,need] of rough) assert(out(src).map(norm).includes(norm(need)),`${src}: rough route missing ${need}; got ${out(src).join(' | ')}`);

console.log(`Driver/househelp follow-up intelligence PASS: ${cases.length} exact chains, ${rough.length} rough routes`);
