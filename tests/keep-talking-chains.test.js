const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

global.window={};
for(const f of ['phrase-library.js','phrase-library-expanded.js','phrase-library-tier23-friction.js','phrase-library-survival.js']){
  vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
}
const search=require('../library-search.js');
vm.runInThisContext(fs.readFileSync('keep-talking.js','utf8'),{filename:'keep-talking.js'});

const lib=window.BOLNA_PHRASE_LIBRARY;
const kt=window.BOLNA_KEEP_TALKING;
const norm=s=>String(s).trim().toLowerCase();

const cases=[
  ['The power keeps going out.',['Is there a scheduled power cut?','The backup power is not working.','Can someone come fix this today?'],['The AC is not cooling properly.']],
  ['The water has stopped.',['When will the water come back?','When does the water supply come?','We need a water tanker.'],['The AC is not cooling properly.']],
  ['When will the water come back?',['When does the water supply come?','The water tank is empty.','We need a water tanker.'],['The refrigerator is not working.']],
  ['I need a plumber today.',['What time will the technician come?','Please call me before you come.','How much will the repair cost?'],['The AC is not cooling properly.']],
  ['What time will the technician come?',['Please call me before you come.','How much will the repair cost?','Please come after 5 PM.'],['We need a water tanker.']],
  ['It is still not fixed.',['Someone came yesterday but it is still broken.','Please send someone else.','How much will the repair cost?'],['The power keeps going out.']],
  ['The driver cannot find my building.',['Please send me your location.','Please come to the main gate.','Please call me when you reach.'],['The water has stopped.']],
  ['The driver is at the wrong gate.',['Please come to the main gate.','Use the other entrance.','Please call me when you reach.'],['Please make it less spicy.']],
  ['The delivery person cannot find the building.',['Please send your location on WhatsApp.','Please leave the package with security.','Please call me when you arrive.'],['I need a plumber today.']],
  ['Please let my guest in.',['Please send them up.','Please call me when my guest arrives.','Please do not send them up yet.'],['The delivery person cannot find the building.']],
  ['The pharmacy does not have this medicine.',['Do you have another brand of this medicine?','Do you have a generic version?','Can you call another pharmacy?'],['Please make it less spicy.']],
  ['Do you have another brand of this medicine?',['Do you have a generic version?','When will this medicine be available?','Can you deliver this medicine tonight?'],['Please take the trash out.']],
  ['Something is missing from my order.',['This is not what I ordered.','Can you make this fresh?','Please pack this separately.'],['The AC is not cooling properly.']],
  ['Please clean this again.',['Please change the bedsheets.','Please take the trash out.','Please leave the key with security.'],['Please come to the main gate.']],
  ['Which counter do I go to?',['What documents do I need?','Where do I get a token?','Where do I sign?'],['Please make it less spicy.']],
  ['Please speak a little slower.',['Can you say that again?','Please say the number again.','Please write it down for me.'],['The water has stopped.']]
];

let passed=0;
for(const [source,expected,weak] of cases){
  const out=kt.resolveSuggestions(lib,search,source,'',5).map(x=>x.english);
  const top3=out.slice(0,3).map(norm);
  for(const phrase of expected.slice(0,3)) assert(top3.includes(norm(phrase)),`${source}: missing expected Top-3 phrase: ${phrase}; got ${out.join(' | ')}`);
  for(const phrase of weak) assert(!top3.includes(norm(phrase)),`${source}: weak distraction outranked chain: ${phrase}`);
  assert(out.length>=3 && out.length<=5,`${source}: expected 3-5 strong suggestions, got ${out.length}`);
  passed++;
}

const roughCases=[
  ['electricity is out',['Is there a scheduled power cut?','The backup power is not working.','Can someone come fix this today?']],
  ['electricity keeps going out',['Is there a scheduled power cut?','The backup power is not working.','Can someone come fix this today?']],
  ['water stopped',['When will the water come back?','When does the water supply come?','We need a water tanker.']],
  ['when will water come back',['When does the water supply come?','The water tank is empty.','We need a water tanker.']],
  ['need plumber today',['What time will the technician come?','Please call me before you come.','How much will the repair cost?']],
  ['what time will plumber come',['Please call me before you come.','How much will the repair cost?','Please come after 5 PM.']],
  ['still leaking',['Someone came yesterday but it is still broken.','Please send someone else.','How much will the repair cost?']],
  ["driver can't find building",['Please send me your location.','Please come to the main gate.','Please call me when you reach.']],
  ['driver at wrong gate',['Please come to the main gate.','Use the other entrance.','Please call me when you reach.']],
  ['delivery person is outside',['Please leave the package with security.','The delivery person can come up.','I will come downstairs in two minutes.']],
  ['package says delivered but missing',['Please leave the package with security.','Ask them to call me.','Please call me when they arrive.']],
  ['guest at the gate',['Please send them up.','Please call me when my guest arrives.','Please do not send them up yet.']],
  ['do you have this medicine',['Do you have another brand of this medicine?','Do you have a generic version?','Can you call another pharmacy?']],
  ['wrong order',['Something is missing from my order.','Can you make this fresh?','Please pack this separately.']],
  ['which counter',['What documents do I need?','Where do I get a token?','Where do I sign?']],
  ['speak slower',['Can you say that again?','Please say the number again.','Please write it down for me.']]
];

let roughPassed=0;
for(const [source,expected] of roughCases){
  const out=kt.resolveSuggestions(lib,search,source,'',5).map(x=>x.english);
  const top3=out.slice(0,3).map(norm);
  for(const phrase of expected) assert(top3.includes(norm(phrase)),`${source}: rough-English route missing Top-3 phrase: ${phrase}; got ${out.join(' | ')}`);
  assert(out.length>=3 && out.length<=5,`${source}: rough-English route expected 3-5 strong suggestions, got ${out.length}`);
  roughPassed++;
}

const chainCount=Object.keys(kt.CURATED_CHAINS).length;
assert(chainCount>=40,`expected at least 40 curated chains, got ${chainCount}`);
assert(kt.ROUGH_ROUTES.length>=30,`expected broad rough-English routing coverage, got ${kt.ROUGH_ROUTES.length}`);
console.log(`Keep Talking conversation-chain benchmark: ${passed}/${cases.length} exact PASS; ${roughPassed}/${roughCases.length} rough-English PASS; curated chains: ${chainCount}; rough routes: ${kt.ROUGH_ROUTES.length}`);
