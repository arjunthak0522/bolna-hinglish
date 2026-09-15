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
assert(depth&&typeof depth.collect==='function','stateful Keep Talking engine missing');

function english(input){return depth.collect(lib,input,6).map(x=>x.english)}
function has(list,re){return list.some(x=>re.test(x))}

// Depth remains useful.
depth.reset();
const driver=english('What time will you come?');
assert(driver.length>=5,`driver suggestions too shallow: ${driver.length}`);
assert(driver.includes('Let me know when you are downstairs.'),'driver arrival continuation missing');
assert(driver.includes('Please come ten minutes early.')||driver.includes('Please wait near the entrance.'),'driver schedule continuation missing');

depth.reset();
const cook=english('What are you cooking today?');
assert(cook.length>=5,`cook suggestions too shallow: ${cook.length}`);
assert(cook.includes('Please use less oil.'),'cook customization missing');
assert(cook.includes('Please make enough for dinner too.'),'cook meal planning missing');

depth.reset();
const househelp=english('Are you coming today?');
assert(househelp.length>=5,`househelp suggestions too shallow: ${househelp.length}`);
assert(househelp.includes('What time are you coming today?'),'househelp arrival timing missing');
assert(househelp.includes('Please tell me if you are running late.'),'househelp late follow-up missing');
assert(househelp.includes('Please tell me in advance if you cannot come.'),'househelp absence follow-up missing');

// Panel case 1: preserve stated time, do not contradict it with canned times.
depth.reset();
const pickup7=english('Driver, please pick me up at 7.');
assert(depth.memory.time==='7',`pickup time not remembered: ${depth.memory.time}`);
assert(!has(pickup7,/come at eight|come by nine|leave at seven thirty/i),`contradictory canned time leaked: ${pickup7}`);
assert(pickup7.includes('Please come ten minutes early.'),'relative timing follow-up missing');
assert(pickup7.includes('Let me know when you are downstairs.')||pickup7.includes('Please wait near the entrance.'),'arrival follow-up missing');

// Panel case 2: choosing an errand pivots the conversation into stop choices.
depth.choose({english:'We have one more stop.'});
const errands=english('We have one more stop.');
assert(depth.memory.flow==='driverErrands',`driver did not pivot to errands: ${depth.memory.flow}`);
assert(errands.includes('First go to the pharmacy.'),'pharmacy errand missing');
assert(errands.includes('Please stop at the grocery store.'),'grocery errand missing');
assert(errands.includes('Please stop at the ATM.')||errands.includes('Please stop at the petrol pump.'),'additional errand branch missing');
assert(!has(errands,/come at eight|come ten minutes early/i),'schedule suggestions leaked into errand phase');

// Panel case 3: petrol choice pivots again into car/fuel actions.
depth.choose({english:'Please stop at the petrol pump.'});
const fuel=english('Please stop at the petrol pump.');
assert(depth.memory.flow==='driverFuel',`driver did not pivot to fuel: ${depth.memory.flow}`);
assert(fuel.includes('Please fill the tank.'),'fill-tank follow-up missing');
assert(fuel.includes('Please check the tyre pressure.'),'tyre-pressure follow-up missing');
assert(!has(fuel,/pharmacy|grocery store|come at eight/i),'unrelated errand/schedule suggestions leaked into fuel phase');

// Panel case 4: kitchen-first becomes an ordered household task sequence.
depth.reset();
const kitchen=english('Maid, please clean the kitchen first.');
assert(depth.memory.flow==='househelpKitchen',`househelp did not enter kitchen sequence: ${depth.memory.flow}`);
assert(kitchen.includes('Please finish the kitchen before you leave.'),'kitchen completion step missing');
assert(kitchen.includes('Please clean the bathroom properly.')||kitchen.includes('Please take the trash out.'),'next household task missing');
assert(!has(kitchen,/what time are you coming|running late/i),'attendance suggestions leaked into task sequence');

// Panel case 5: cooking customization progresses to portion/storage, not meal reset.
depth.reset();
const customize=english('Cook, please use less oil and less spice.');
assert(depth.memory.flow==='cookCustomize',`cook did not enter customization flow: ${depth.memory.flow}`);
assert(customize.includes('Please use less salt.')||customize.includes('Please do not add ghee.'),'cook customization continuation missing');
assert(customize.includes('Please make enough for dinner too.')||customize.includes('Please save the leftovers.'),'cook portion/storage continuation missing');
assert(!customize.includes('Please make dal, rice, and one vegetable.'),'specific meal was invented after customization');

depth.choose({english:'Please make enough for dinner too.'});
const leftovers=english('Please make enough for dinner too.');
assert(depth.memory.flow==='cookLeftovers',`cook did not progress to leftovers: ${depth.memory.flow}`);
assert(leftovers.includes('Please save the leftovers.')||leftovers.includes('Please put the food in the fridge.'),'leftover/storage follow-up missing');
assert(!leftovers.includes('What are you cooking today?'),'conversation regressed to meal planning');

for(const list of [driver,cook,househelp,pickup7,errands,fuel,kitchen,customize,leftovers]){
  assert(new Set(list).size===list.length,'duplicate Keep Talking suggestions found');
  assert(!list.some(x=>/speak a little slower|write it down|say that again/i.test(x)),'generic fallback leaked into contextual suggestions');
}

console.log(JSON.stringify({driver,cook,househelp,pickup7,errands,fuel,kitchen,customize,leftovers},null,2));
console.log('Stateful Keep Talking panel QA PASS');