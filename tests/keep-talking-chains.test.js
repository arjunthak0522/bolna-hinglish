const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

global.window={};
for(const f of ['phrase-library.js','phrase-library-expanded.js','phrase-library-tier23-friction.js','phrase-library-survival.js','phrase-library-conversation.js']) vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const search=require('../library-search.js');
vm.runInThisContext(fs.readFileSync('keep-talking.js','utf8'),{filename:'keep-talking.js'});

const lib=window.BOLNA_PHRASE_LIBRARY;
const kt=window.BOLNA_KEEP_TALKING;
const norm=s=>String(s||'').trim().toLowerCase();
const suggest=s=>kt.resolveSuggestions(lib,search,s,'',3).map(x=>x.english);

const coherence=[
  {src:'Is there a scheduled power cut?',need:['The backup power is not working.','The generator has not started.'],ban:['When will the water come back?','I need a plumber today.']},
  {src:'We need a water tanker.',need:['How long will the water tanker take?','How much will the water tanker cost?'],ban:['How much will the repair cost?','I need a plumber today.','The water tank is empty.']},
  {src:'There is a leak under the sink.',need:['I need a plumber today.','Can someone come fix this today?'],ban:['Please check the leak again.','We need a water tanker.']},
  {src:'Please call me before you come.',need:['Please come after 5 PM.','What time will the technician come?'],ban:['It is still not fixed.','Please send someone else.']},
  {src:'It is still not fixed.',need:['Please send someone else.','Can someone come fix this today?'],ban:['Someone came yesterday but it is still broken.','Please check the leak again.']},
  {src:'The driver cannot find my building.',need:["I'll send you my location.",'Please come to the main gate.'],ban:['Please send me your location.','Please wait here for ten minutes.','Use the other entrance.']},
  {src:"I'll send you my location.",need:['Please come to the main gate.','Please call me when you reach.'],ban:['Please send me your location.','Please wait here for ten minutes.']},
  {src:'The driver is at the wrong gate.',need:['Use the other entrance.','Please come to the main gate.','Which gate are you at?'],ban:['Please send me your location.','Please wait here for ten minutes.']},
  {src:'Please wait here for ten minutes.',need:['I will be ten minutes late.','You do not need to wait.'],ban:['Please come back at 6 PM.','Please call me when you reach.']},
  {src:'The delivery person cannot find the building.',need:["I'll send you my location.",'Please come to the main gate.'],ban:['Please leave the package with security.','Please send me your location.']},
  {src:'The delivery person says he is outside.',need:['I will come downstairs in two minutes.','Please leave the package with security.','Which gate are you at?'],ban:['Please send your location on WhatsApp.']},
  {src:'My package says delivered but I do not have it.',need:['Can you check where the package was left?','Can you check with security?','Please ask the delivery person to call me.'],ban:['Please leave the package with security.','Please call me when they arrive.','I will come downstairs in two minutes.']},
  {src:'Please let my guest in.',need:['Please call me when my guest arrives.','Please send them up.'],ban:['Please do not send them up yet.','My guest is coming in ten minutes.']},
  {src:'Can you deliver this medicine tonight?',need:['Can you deliver the medicine to my apartment?','Please call me if you find this medicine.'],ban:['How many times a day should I take this?','Should I take this with food?','Should I take this on an empty stomach?']},
  {src:'Please make it less spicy.',need:['Please use less oil.','Please pack this separately.','Can you make this fresh?'],ban:['This is not what I ordered.','Something is missing from my order.','No sugar, please.']},
  {src:'Something is missing from my order.',need:['Can you send the missing item now?','Please check the order again.'],ban:['This is not what I ordered.','Can you make this fresh?','Please pack this separately.']},
  {src:'This is not what I ordered.',need:['Please replace this.','Please check the order again.'],ban:['Something is missing from my order.','Please pack this separately.','No sugar, please.']},
  {src:'Please come later today.',need:['Please come after 5 PM.','Please call me before you come.'],ban:['Please come tomorrow instead.','Please clean this again.']},
  {src:'Please come tomorrow instead.',need:['Please call me before you come.','Please leave the key with security.'],ban:['Please come later today.','Please clean this again.']},
  {src:'Please clean this again.',need:['Please do not use this cleaner.','Please change the bedsheets.'],ban:['Please come later today.','Please come tomorrow instead.']},
  {src:'Which counter do I go to?',need:['Where do I get a token?','What documents do I need?'],ban:['Please make it less spicy.','Please come to the main gate.']},
  {src:'Please speak a little slower.',need:['Can you say that again?','Please write it down for me.'],ban:['The water has stopped.','Please make it less spicy.']}
];

let pass=0;
for(const c of coherence){
  const out=suggest(c.src),top=out.map(norm);
  assert(out.length>=1&&out.length<=3,`${c.src}: expected 1-3 high-confidence turns, got ${out.join(' | ')}`);
  for(const x of c.need) assert(top.includes(norm(x)),`${c.src}: missing plausible continuation ${x}; got ${out.join(' | ')}`);
  for(const x of c.ban) assert(!top.includes(norm(x)),`${c.src}: incoherent continuation leaked into Top-3: ${x}`);
  assert(new Set(top).size===top.length,`${c.src}: duplicate suggestion`);
  assert(!top.includes(norm(c.src)),`${c.src}: suggested itself`);
  pass++;
}

const rough=[
  ["driver can't find building",["I'll send you my location.",'Please come to the main gate.'],['Please send me your location.']],
  ['need a water tanker',['How long will the water tanker take?','How much will the water tanker cost?'],['How much will the repair cost?']],
  ['delivery person is outside',['I will come downstairs in two minutes.','Which gate are you at?'],['Please send your location on WhatsApp.']],
  ['package says delivered but missing',['Can you check where the package was left?','Can you check with security?'],['Please leave the package with security.']],
  ['still leaking',['Please send someone else.','Can someone come fix this today?'],['Someone came yesterday but it is still broken.']],
  ['do you have this medicine',['Do you have another brand of this medicine?'],['How many times a day should I take this?']],
  ['wrong order',['Please replace this.','Please check the order again.'],['Something is missing from my order.']],
  ['missing item from my order',['Can you send the missing item now?','Please check the order again.'],['Please pack this separately.']],
  ['which counter',['Where do I get a token?'],['Please make it less spicy.']],
  ['speak slower',['Can you say that again?'],['The water has stopped.']]
];
let roughPass=0;
for(const [src,need,ban] of rough){
  const out=suggest(src).map(norm);
  for(const x of need) assert(out.includes(norm(x)),`${src}: rough route missing ${x}; got ${out.join(' | ')}`);
  for(const x of ban) assert(!out.includes(norm(x)),`${src}: rough route leaked incoherent ${x}`);
  roughPass++;
}

for(const [key,state] of Object.entries(kt.CONVERSATION_GRAPH)){
  assert(state.scenario&&state.partner&&state.phase&&state.owner,`${key}: incomplete conversation state metadata`);
  assert(Array.isArray(state.next)&&state.next.length>=1,`${key}: no high-confidence next turn`);
  assert(new Set(state.next.map(norm)).size===state.next.length,`${key}: duplicate graph target`);
  assert(!state.next.map(norm).includes(norm(key)),`${key}: graph points to itself`);
}

const newlyRequired=[
  'How long will the water tanker take?',
  'How much will the water tanker cost?',
  "I'll send you my location.",
  'Which gate are you at?',
  'Can you check where the package was left?',
  'Can you check with security?',
  'Please ask the delivery person to call me.',
  'Can you send the missing item now?',
  'Please check the order again.',
  'Please replace this.'
];
for(const phrase of newlyRequired) assert(lib.some(x=>norm(x.english)===norm(phrase)),`missing targeted continuation phrase: ${phrase}`);

assert(Object.keys(kt.CONVERSATION_GRAPH).length>=50,'conversation graph coverage regressed');
assert(kt.ROUGH_ROUTES.length>=40,'rough English routing coverage regressed');
console.log(`Keep Talking panel coherence benchmark: ${pass}/${coherence.length} exact PASS; ${roughPass}/${rough.length} rough PASS; graph nodes: ${Object.keys(kt.CONVERSATION_GRAPH).length}; rough routes: ${kt.ROUGH_ROUTES.length}; targeted continuation phrases: ${newlyRequired.length}`);
