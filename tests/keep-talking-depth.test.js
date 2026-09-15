const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

global.window={};
for(const f of ['phrase-library.js','phrase-library-expanded.js','phrase-library-tier23-friction.js','phrase-library-survival.js','phrase-library-conversation.js','phrase-library-driver-househelp.js']){
  vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
}
vm.runInThisContext(fs.readFileSync('keep-talking.js','utf8'),{filename:'keep-talking.js'});
vm.runInThisContext(fs.readFileSync('keep-talking-driver-househelp.js','utf8'),{filename:'keep-talking-driver-househelp.js'});
vm.runInThisContext(fs.readFileSync('keep-talking-depth.js','utf8'),{filename:'keep-talking-depth.js'});

const lib=window.BOLNA_PHRASE_LIBRARY;
const kt=window.BOLNA_KEEP_TALKING;
const norm=s=>String(s||'').trim().toLowerCase();
const suggest=(english,context)=>kt.enhancedSuggestions(lib,english,context,6).map(x=>x.english);

function assertRich(src,ctx,required=[]){
  const got=suggest(src,ctx);
  assert.strictEqual(got.length,6,`${src}: expected 6 suggestions, got ${got.length}: ${got.join(' | ')}`);
  assert.strictEqual(new Set(got.map(norm)).size,got.length,`${src}: duplicate suggestions`);
  assert(!got.map(norm).includes(norm(src)),`${src}: suggested itself`);
  for(const need of required)assert(got.map(norm).includes(norm(need)),`${src}: missing ${need}; got ${got.join(' | ')}`);
  return got;
}

assertRich('What time will you come?','Driver',['Please come at eight.','Please come ten minutes early.','Let me know when you are downstairs.']);
assertRich('Please come ten minutes early.','Driver',['Let me know when you are downstairs.','Please wait near the entrance.','Wait until I call you.']);
assertRich('Please follow Google Maps.','Driver',['Take the next right.','Take a U-turn here.','Please drive carefully.']);
assertRich('Please stop at the grocery store.','Driver',['Please stop at the ATM.','Please stop at the petrol pump.','After that, go home.']);
assertRich('Please pick me up at 7, wait downstairs, and call me when you arrive.','Driver',['Please come ten minutes early.','Let me know when you are downstairs.','Please wait near the entrance.']);

assertRich('Are you coming today?','Household',['What time are you coming today?','Please tell me if you are running late.','Please tell me in advance if you cannot come.']);
assertRich('Please clean the bathroom properly.','Household',['Please clean the kitchen first.','Please sweep and mop the floor.','Please clean under the sofa.']);
assertRich('Please change the bedsheets.','Household',['Please wash the towels separately.','Please hang these clothes to dry.','Please iron only the shirts.']);
assertRich('Please use less salt.','Household',['Please make it less spicy.','Please use less oil.','Please make enough for dinner too.']);
assertRich('Please put the food in the fridge.','Household',['Please make enough for dinner too.','Please save the leftovers.','Please turn off the gas when you finish.']);
assertRich('The maid is here and I need her to clean before guests arrive.','Household',['Please clean the kitchen first.','Please sweep and mop the floor.','Please clean the bathroom properly.']);

const genericDriver=suggest('I need the driver for a few errands this afternoon.','Driver').map(norm);
assert(!genericDriver.includes('please speak a little slower'),`driver fallback regressed to generic communication suggestions`);
const genericHouse=suggest('I need the maid and cook to get things ready today.','Household').map(norm);
assert(!genericHouse.includes('please say that again'),`household fallback regressed to generic communication suggestions`);

console.log('Keep Talking depth PASS: six-choice context-aware driver/househelp/cook chains with continued depth');
