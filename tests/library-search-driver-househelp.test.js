const fs=require('fs');
const vm=require('vm');
global.window={};
for(const f of ['phrase-library.js','phrase-library-expanded.js','phrase-library-tier23-friction.js','phrase-library-survival.js','phrase-library-conversation.js','phrase-library-driver-househelp.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'));
const search=require('../library-search.js');
const lib=window.BOLNA_PHRASE_LIBRARY;
const cases=[
['driver what time today','What time will you come?'],
['driver 8 am','Please come at eight.'],
['come 10 min early','Please come ten minutes early.'],
['driver wait in car','Please wait in the car.'],
['bring car around','Please bring the car around.'],
['same place pickup','Pick me up from the same place.'],
['other gate drop','Drop me at the other gate.'],
['stop chemist','First go to the pharmacy.'],
['stop grocery driver','Please stop at the grocery store.'],
['petrol pump stop','Please stop at the petrol pump.'],
['fill petrol full','Please fill the tank.'],
['tire air check','Please check the tyre pressure.'],
['open dicky','Please open the trunk.'],
['avoid potholes road','Please avoid the rough road.'],
['maid coming today','Are you coming today?'],
['maid what time today','What time are you coming today?'],
['maid late tell me','Please tell me if you are running late.'],
['maid absent tell before','Please tell me in advance if you cannot come.'],
['maid tomorrow holiday','You can take tomorrow off.'],
['maid sweep mop','Please sweep and mop the floor.'],
['pocha less water','Please use less water when mopping.'],
['clean under sofa','Please clean under the sofa.'],
['bathroom deep clean','Please clean the bathroom properly.'],
['wash towels separate','Please wash the towels separately.'],
['hang clothes dry','Please hang these clothes to dry.'],
['cook what today','What are you cooking today?'],
['cook dal rice sabzi','Please make dal, rice, and one vegetable.'],
['4 chapati','Please make four rotis.'],
['cook less salt','Please use less salt.'],
['cook less mirchi','Please make it less spicy.'],
['no ghee cooking','Please do not add ghee.'],
['cook extra dinner','Please make enough for dinner too.'],
['save leftover food','Please save the leftovers.'],
['food fridge','Please put the food in the fridge.'],
['grocery list cook','Please make a grocery list.'],
['tell before groceries finish','Please tell me before something runs out.'],
['turn gas off','Please turn off the gas when you finish.'],
['maid leave key guard','Please leave the key with security.']
];
let top1=0,top3=0;const failures=[];
for(const [q,expected] of cases){const results=search.rank(lib,q,'All').slice(0,3).map(x=>x.item.english);if(results[0]===expected)top1++;if(results.includes(expected))top3++;else failures.push({q,expected,results});}
const total=cases.length,top1Rate=top1/total,top3Rate=top3/total;
console.log(JSON.stringify({benchmark:'driver-househelp-tier23',total,top1,top3,top1Rate,top3Rate,failures},null,2));
if(top3Rate<0.92)throw new Error(`Driver/househelp Top-3 accuracy ${(top3Rate*100).toFixed(1)}% is below 92%`);
