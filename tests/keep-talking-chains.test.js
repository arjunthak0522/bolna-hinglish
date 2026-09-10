const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

global.window={};
for(const f of ['phrase-library.js','phrase-library-expanded.js','phrase-library-tier23-friction.js','phrase-library-survival.js']) vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const search=require('../library-search.js');
vm.runInThisContext(fs.readFileSync('keep-talking.js','utf8'),{filename:'keep-talking.js'});

const lib=window.BOLNA_PHRASE_LIBRARY;
const kt=window.BOLNA_KEEP_TALKING;
const norm=s=>String(s||'').trim().toLowerCase();
const suggest=s=>kt.resolveSuggestions(lib,search,s,'',3).map(x=>x.english);

const coherence=[
  {src:'The driver cannot find my building.',need:['Please come to the main gate.','Please call me when you reach.'],ban:['Please send me your location.','Please wait here for ten minutes.']},
  {src:'The driver is at the wrong gate.',need:['Use the other entrance.','Please come to the main gate.'],ban:['Please send me your location.']},
  {src:'We need a water tanker.',need:['Please call me before you come.','When does the water supply come?'],ban:['How much will the repair cost?','I need a plumber today.']},
  {src:'Please call me before you come.',need:['Please come after 5 PM.','What time will the technician come?'],ban:['It is still not fixed.','Please send someone else.']},
  {src:'The water tank is empty.',need:['We need a water tanker.','When will the water come back?'],ban:['I need a plumber today.','How much will the repair cost?']},
  {src:'Can you deliver this medicine tonight?',need:['Please call me if you find this medicine.','When will this medicine be available?'],ban:['How many times a day should I take this?','Should I take this with food?','Should I take this on an empty stomach?']},
  {src:'Please make it less spicy.',need:['Please pack this separately.','Can you make this fresh?'],ban:['No sugar, please.']},
  {src:'Something is missing from my order.',need:['This is not what I ordered.','Can you make this fresh?'],ban:['Please pack this separately.']},
  {src:'The delivery person says he is outside.',need:['I will come downstairs in two minutes.','Please leave the package with security.'],ban:['Please send your location on WhatsApp.']},
  {src:'Please let my guest in.',need:['Please call me when my guest arrives.','Please send them up.'],ban:['The delivery person cannot find the building.']},
  {src:'It is still not fixed.',need:['Please send someone else.','Someone came yesterday but it is still broken.'],ban:['What time will the technician come?']},
  {src:'Which counter do I go to?',need:['Where do I get a token?','What documents do I need?'],ban:['Please make it less spicy.']},
  {src:'Please speak a little slower.',need:['Can you say that again?','Please write it down for me.'],ban:['The water has stopped.']}
];

let pass=0;
for(const c of coherence){
  const out=suggest(c.src),top=out.map(norm);
  assert(out.length>=2&&out.length<=3,`${c.src}: expected 2-3 strong turns, got ${out.join(' | ')}`);
  for(const x of c.need) assert(top.includes(norm(x)),`${c.src}: missing plausible continuation ${x}; got ${out.join(' | ')}`);
  for(const x of c.ban) assert(!top.includes(norm(x)),`${c.src}: incoherent continuation leaked into Top-3: ${x}`);
  assert(new Set(top).size===top.length,`${c.src}: duplicate suggestion`);
  assert(!top.includes(norm(c.src)),`${c.src}: suggested itself`);
  pass++;
}

const rough=[
  ["driver can't find building",['Please come to the main gate.'],['Please send me your location.']],
  ['need a water tanker',['Please call me before you come.'],['How much will the repair cost?']],
  ['delivery person is outside',['I will come downstairs in two minutes.'],['Please send your location on WhatsApp.']],
  ['still leaking',['Please send someone else.'],['What time will the technician come?']],
  ['do you have this medicine',['Do you have another brand of this medicine?'],['How many times a day should I take this?']],
  ['wrong order',['Something is missing from my order.'],['No sugar, please.']],
  ['which counter',['Where do I get a token?'],['Please make it less spicy.']],
  ['speak slower',['Can you say that again?'],['The water has stopped.']]
];
let roughPass=0;
for(const [src,need,ban] of rough){
  const out=suggest(src).map(norm);
  for(const x of need) assert(out.includes(norm(x)),`${src}: rough route missing ${x}`);
  for(const x of ban) assert(!out.includes(norm(x)),`${src}: rough route leaked incoherent ${x}`);
  roughPass++;
}

for(const [key,state] of Object.entries(kt.CONVERSATION_GRAPH)){
  assert(state.scenario&&state.partner&&state.phase&&state.owner,`${key}: incomplete conversation state metadata`);
  assert(Array.isArray(state.next)&&state.next.length>=2,`${key}: insufficient next-turn candidates`);
}
assert(Object.keys(kt.CONVERSATION_GRAPH).length>=40,'conversation graph coverage regressed');
assert(kt.ROUGH_ROUTES.length>=30,'rough English routing coverage regressed');
console.log(`Keep Talking coherence benchmark: ${pass}/${coherence.length} exact PASS; ${roughPass}/${rough.length} rough PASS; graph nodes: ${Object.keys(kt.CONVERSATION_GRAPH).length}; rough routes: ${kt.ROUGH_ROUTES.length}`);
