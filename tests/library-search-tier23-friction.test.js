const fs=require('fs');
const vm=require('vm');
global.window={};
vm.runInThisContext(fs.readFileSync('phrase-library.js','utf8'));
vm.runInThisContext(fs.readFileSync('phrase-library-expanded.js','utf8'));
vm.runInThisContext(fs.readFileSync('phrase-library-tier23-friction.js','utf8'));
const search=require('../library-search.js');
const lib=window.BOLNA_PHRASE_LIBRARY;

const cases=[
  ['backup power not working','The backup power is not working.'],
  ['when will water be back','When will the water come back?'],
  ['water stopped','The water has stopped.'],
  ['need electrician today','I need an electrician today.'],
  ['need plumber today','I need a plumber today.'],
  ['fridge not working','The refrigerator is not working.'],
  ['washing machine broken','The washing machine is not working.'],
  ['road outside flooded','The road outside is flooded.'],
  ['driver come another way','Can you come another way?'],
  ['call me when you reach','Please call me when you reach.'],
  ['im outside building','I am outside the building.'],
  ['driver cant find my building','The driver cannot find my building.'],
  ['medicine another brand','Do you have another brand of this medicine?'],
  ['when medicine available','When will this medicine be available?'],
  ['deliver medicine to apartment','Can you deliver the medicine to my apartment?'],
  ['call me if you find medicine','Please call me if you find this medicine.'],
  ['delivery person cant find building','The delivery person cannot find the building.'],
  ['someone parked in my spot','Someone is parked in my spot.'],
  ['cheaper option','Do you have a cheaper option?'],
  ['where exactly is your shop','Where exactly is your shop?'],
  ['speak slower please','Please speak a little slower.'],
  ['i understand little hindi','I understand a little Hindi.'],
  ['say that again','Can you say that again?'],
  ['explain simply','Please explain it simply.']
];

let top1=0,top3=0;const failures=[];
for(const [q,expected] of cases){
  const results=search.rank(lib,q,'All').slice(0,3).map(x=>x.item.english);
  if(results[0]===expected)top1++;
  if(results.includes(expected))top3++;
  else failures.push({q,expected,results});
}
const total=cases.length,top1Rate=top1/total,top3Rate=top3/total;
console.log(JSON.stringify({benchmark:'tier2-tier3-expat-friction',librarySize:lib.length,total,top1,top3,top1Rate,top3Rate,failures},null,2));
if(lib.length<205)throw new Error(`Expected expanded library >=205 phrases, got ${lib.length}`);
if(top3Rate<0.90)throw new Error(`Tier 2/3 friction Top-3 accuracy ${(top3Rate*100).toFixed(1)}% is below 90%`);
