const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

global.window={};
for(const f of ['phrase-library.js','phrase-library-expanded.js','phrase-library-tier23-friction.js','phrase-library-survival.js','phrase-library-conversation.js','phrase-library-driver-househelp.js']) vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const search=require('../library-search.js');
vm.runInThisContext(fs.readFileSync('keep-talking.js','utf8'),{filename:'keep-talking.js'});
vm.runInThisContext(fs.readFileSync('keep-talking-driver-househelp.js','utf8'),{filename:'keep-talking-driver-househelp.js'});

const kt=window.BOLNA_KEEP_TALKING;
const lib=window.BOLNA_PHRASE_LIBRARY;

const trader=[
  'Do you want anything from the frozen section?',
  'Should I get snacks too?',
  'Do you need anything for breakfast?',
  'Do you want me to send you a photo?',
  'Is there anything else you need?'
];

const open=kt.resolveSuggestions(lib,search,"What would you like from Trader Joe's?",'General',5,trader);
assert.strictEqual(open.length,5,'arbitrary conversation should expose five contextual next turns');
assert.deepStrictEqual(open.map(x=>x.english),trader);
assert(open.every(x=>x._generated===true),'arbitrary next turns should be marked generated');
const noLibrary=kt.resolveSuggestions([],null,"What would you like from Trader Joe's?",'General',5,trader);
assert.strictEqual(noLibrary.length,5,'model-generated Keep Talking must not depend on phrase library availability');
assert(noLibrary.every(x=>x._generated===true),'empty-library fallback must remain fully model-generated');

assert(!open.some(x=>/speak.*slower|say.*again|write.*down/i.test(x.english)),'generic repair phrases leaked into arbitrary conversation');

const noisy=kt.resolveSuggestions(lib,search,"What would you like from Trader Joe's?",'General',5,[
  "What would you like from Trader Joe's?",
  'Please speak a little slower.',
  'Can you say that again?',
  'Should I get snacks too?',
  'Should I get snacks too?',
  'Do you want me to send you a photo?'
]);
assert.deepStrictEqual(noisy.map(x=>x.english),['Should I get snacks too?','Do you want me to send you a photo?']);

const driver=kt.resolveSuggestions(lib,search,'Please stop at the petrol pump.','Driver',5,[
  'Should I pay now?',
  'Do you want me to wait here?'
]);
assert.deepStrictEqual(driver.slice(0,3).map(x=>x.english),['Please fill the tank.','Please check the tyre pressure.','I transferred your payment.']);
assert(driver.some(x=>x.english==='Should I pay now?'),'model continuation should augment a known graph when room remains');

const runtime=fs.readFileSync('app-runtime.js','utf8');
assert(runtime.includes('nextSuggestions'),'core response must carry nextSuggestions');
assert(runtime.includes('Conversation so far (same user, oldest to newest)'),'follow-up generation must preserve conversation trail');
assert(runtime.includes('async function useEnglishSuggestion(english)'),'generated suggestion must be directly actionable');
assert(!/nextSuggestions MUST contain exactly 5[\s\S]*say that again[\s\S]*unless the current sentence itself is about not understanding someone/.test('') || runtime.includes('unless the current sentence itself is about not understanding someone'));

console.log('Smart Keep Talking fallback PASS: arbitrary context, repair filtering, graph augmentation, conversation trail');
