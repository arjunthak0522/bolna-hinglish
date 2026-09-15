const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
global.window={};
for(const f of [
  'phrase-library.js','phrase-library-expanded.js','phrase-library-tier23-friction.js','phrase-library-survival.js','phrase-library-conversation.js','phrase-library-driver-househelp.js',
  'keep-talking.js','keep-talking-driver-househelp.js','keep-talking-depth.js'
]) vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});

const lib=window.BOLNA_PHRASE_LIBRARY;
const depth=window.BOLNA_KEEP_TALKING_DEPTH;
assert(depth&&typeof depth.collect==='function','depth recommendation engine missing');

function english(input){return depth.collect(lib,input,6).map(x=>x.english)}

const driver=english('What time will you come?');
assert(driver.length>=5,`driver suggestions too shallow: ${driver.length}`);
assert(driver[0]==='Please come at eight.','direct driver next step should stay first');
assert(driver.includes('Let me know when you are downstairs.'),'driver arrival continuation missing');
assert(driver.includes('Please wait near the entrance.')||driver.includes('Please come ten minutes early.'),'driver schedule continuation missing');

const cook=english('What are you cooking today?');
assert(cook.length>=5,`cook suggestions too shallow: ${cook.length}`);
assert(cook.includes('Please use less oil.'),'cook customization missing');
assert(cook.includes('Please make enough for dinner too.'),'cook meal planning missing');
assert(cook.includes('Please use less salt.')||cook.includes('Please make it less spicy.'),'cook second-hop continuation missing');

const househelp=english('Are you coming today?');
assert(househelp.length>=5,`househelp suggestions too shallow: ${househelp.length}`);
assert(househelp.includes('What time are you coming today?'),'househelp arrival timing missing');
assert(househelp.includes('Please tell me if you are running late.'),'househelp late follow-up missing');
assert(househelp.includes('Please tell me in advance if you cannot come.'),'househelp absence follow-up missing');

for(const list of [driver,cook,househelp]){
  assert(new Set(list).size===list.length,'duplicate Keep Talking suggestions found');
  assert(!list.some(x=>/speak a little slower|write it down|say that again/i.test(x)),'generic fallback leaked into contextual suggestions');
}

console.log(JSON.stringify({driver,cook,househelp},null,2));
console.log('Keep Talking depth PASS');