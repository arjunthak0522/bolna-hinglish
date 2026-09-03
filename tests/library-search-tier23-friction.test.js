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
  ['generator did not start','The generator has not started.'],
  ['scheduled power cut','Is there a scheduled power cut?'],
  ['water tank empty','The water tank is empty.'],
  ['when does water supply come','When does the water supply come?'],
  ['need water tanker','We need a water tanker.'],
  ['toilet clogged','The toilet is clogged.'],
  ['leak under sink','There is a leak under the sink.'],
  ['ac running but room not cold','The AC is running but the room is not getting cold.'],
  ['fridge stopped cooling','The refrigerator stopped cooling.'],
  ['washing machine wont drain','The washing machine will not drain.'],
  ['elevator not working','The elevator is not working.'],
  ['someone fix this today','Can someone come fix this today?'],
  ['how much repair cost','How much will the repair cost?'],
  ['call me before you come','Please call me before you come.'],
  ['water purifier needs service','The water purifier needs service.'],
  ['driver come another way','Can you come another way?'],
  ['call me when you reach','Please call me when you reach.'],
  ['im outside building','I am outside the building.'],
  ['driver cant find my building','The driver cannot find my building.'],
  ['driver wrong gate','The driver is at the wrong gate.'],
  ['send me your location','Please send me your location.'],
  ['cant find your location','I cannot find your location.'],
  ['medicine another brand','Do you have another brand of this medicine?'],
  ['when medicine available','When will this medicine be available?'],
  ['deliver medicine to apartment','Can you deliver the medicine to my apartment?'],
  ['call me if you find medicine','Please call me if you find this medicine.'],
  ['generic version medicine','Do you have a generic version?'],
  ['deliver medicine tonight','Can you deliver this medicine tonight?'],
  ['where get blood test','Where can I get a blood test?'],
  ['lab need appointment','Do I need an appointment for the lab?'],
  ['delivery person cant find building','The delivery person cannot find the building.'],
  ['someone parked in my spot','Someone is parked in my spot.'],
  ['delivery person says outside','The delivery person says he is outside.'],
  ['leave package with security','Please leave the package with security.'],
  ['package says delivered dont have it','My package says delivered but I do not have it.'],
  ['stray dogs near gate','There are stray dogs near the gate.'],
  ['construction noise too loud','The construction noise is too loud.'],
  ['what time music stop','What time will the music stop?'],
  ['cheaper option','Do you have a cheaper option?'],
  ['where exactly is your shop','Where exactly is your shop?'],
  ['where photocopy this','Where can I get this photocopied?'],
  ['speak slower please','Please speak a little slower.'],
  ['i understand little hindi','I understand a little Hindi.'],
  ['say that again','Can you say that again?'],
  ['explain simply','Please explain it simply.'],
  ['which counter do i go to','Which counter do I go to?'],
  ['where get token','Where do I get a token?'],
  ['help fill out form','Can you help me fill out this form?']
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
if(lib.length<237)throw new Error(`Expected expanded library >=237 phrases, got ${lib.length}`);
if(top3Rate<0.90)throw new Error(`Tier 2/3 friction Top-3 accuracy ${(top3Rate*100).toFixed(1)}% is below 90%`);
