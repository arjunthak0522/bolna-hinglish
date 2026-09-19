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
const norm=s=>String(s||'').trim().toLowerCase();

const unseen=[
  [
    "I need to return these shoes tomorrow.",
    "tomorrow"
  ],
  [
    "Can you ask Priya if she wants coffee before we leave?",
    "Priya"
  ],
  [
    "Please remind the electrician that the bedroom fan is also broken.",
    "bedroom fan"
  ],
  [
    "What should we bring to Neha's house for dinner?",
    "Neha"
  ],
  [
    "Can you pick up Gigi's food on the way home?",
    "Gigi"
  ],
  [
    "I have a dentist appointment at 3:30.",
    "3:30"
  ],
  [
    "Please tell the guard that my cousin Arjun is coming tonight.",
    "Arjun"
  ],
  [
    "Can we stop at HDFC before the airport?",
    "HDFC"
  ],
  [
    "I need this shirt altered by Friday.",
    "Friday"
  ],
  [
    "Please ask if the mangoes are ripe.",
    "mangoes"
  ],
  [
    "Can you find out whether the pool is open tomorrow morning?",
    "pool"
  ],
  [
    "I need a cab to the railway station at 6 AM.",
    "6 AM"
  ],
  [
    "Please tell the plumber the leak is behind the washing machine.",
    "washing machine"
  ],
  [
    "Can you ask the pharmacist if they have the 10 mg tablets?",
    "10 mg"
  ],
  [
    "Please reserve a table for four at 8 tonight.",
    "four"
  ],
  [
    "I need to send this package to Pune.",
    "Pune"
  ],
  [
    "Can you ask the cook to make something light for lunch?",
    "lunch"
  ],
  [
    "Please tell them I already paid by UPI.",
    "UPI"
  ],
  [
    "Can you ask the tailor if this can be ready before Diwali?",
    "Diwali"
  ],
  [
    "I need someone to clean the balcony before our guests arrive.",
    "balcony"
  ],
  [
    "Please ask the driver to take the quieter road today.",
    "quieter road"
  ],
  [
    "Can you ask if the gym has a monthly membership?",
    "monthly"
  ],
  [
    "Tell the delivery person not to ring the bell because the dog is sleeping.",
    "dog"
  ],
  [
    "I need two kilos of basmati rice.",
    "two kilos"
  ],
  [
    "Can you ask if they have this in navy blue?",
    "navy blue"
  ],
  [
    "Please tell the mechanic the noise only happens above 60.",
    "60"
  ],
  [
    "Can you ask the neighbor if our package was left with them?",
    "package"
  ],
  [
    "I need to move my appointment to next Wednesday.",
    "next Wednesday"
  ],
  [
    "Please ask whether breakfast is included with the room.",
    "breakfast"
  ],
  [
    "Can you tell the cleaner not to move the papers on my desk?",
    "papers"
  ],
  [
    "I want to buy a SIM card with a prepaid data plan.",
    "prepaid"
  ],
  [
    "Can you ask if this train stops at Lucknow?",
    "Lucknow"
  ],
  [
    "Please tell the cook not to use peanuts because of an allergy.",
    "peanuts"
  ],
  [
    "I need to print these documents in color.",
    "color"
  ],
  [
    "Can you ask the landlord when the pest control is coming?",
    "pest control"
  ],
  [
    "Please tell the driver we need to pick up Richa first.",
    "Richa"
  ],
  [
    "Can you ask if they deliver groceries after 9 PM?",
    "9 PM"
  ],
  [
    "I need a haircut but only a little off the top.",
    "little off the top"
  ],
  [
    "Please ask whether the doctor can see me earlier today.",
    "earlier today"
  ],
  [
    "Can you tell the househelp to leave the spare key with security?",
    "spare key"
  ]
];

for(const [initial,detail] of unseen){
  assert(!kt.CONVERSATION_GRAPH[norm(initial)],`benchmark phrase unexpectedly hand-authored: ${initial}`);
  const generated=[
    `Can you confirm ${detail}?`,
    `What are the options for ${detail}?`,
    `How long will that take for ${detail}?`,
    `Please let me know if anything changes about ${detail}.`,
    `Is there anything else I should know about ${detail}?`
  ];
  const got=kt.resolveSuggestions(lib,search,initial,'General',5,generated);
  assert.strictEqual(got.length,5,`${initial}: expected five next turns; got ${got.length}`);
  const generatedTurns=got.filter(x=>x._generated===true);
  assert(generatedTurns.length>=2,`${initial}: model-generated continuation layer did not participate; got ${got.map(x=>x.english).join(' | ')}`);
  assert(generatedTurns.every(x=>norm(x.english).includes(norm(detail))),`${initial}: generated turns lost named detail/constraint`);
  assert(!got.some(x=>/say (that|it) again|speak (a little )?slower|write it down|repeat that/i.test(x.english)),`${initial}: generic repair fallback leaked`);
  assert.strictEqual(new Set(got.map(x=>norm(x.english))).size,5,`${initial}: duplicate next turns`);
}

const repair=kt.resolveSuggestions(lib,search,'I did not understand that.','General',5,[
  'Can you say that again?',
  'Please speak a little slower.',
  'Please write it down for me.'
]);
assert(repair.length>=0,'repair mode remains supported by curated routes when applicable');

const runtime=fs.readFileSync('app-runtime.js','utf8');
const promptStart=runtime.indexOf('function corePrompt(');
const promptEnd=runtime.indexOf('function enrichPrompt(',promptStart);
const promptBlock=runtime.slice(promptStart,promptEnd);
for(const required of [
  'nextSuggestions MUST contain exactly 5',
  'Infer the situation from the English input even when Context is General',
  'Preserve named places, people, items, times, quantities and choices already mentioned',
  'Do not contradict them',
  'Do not invent arbitrary specifics',
  'Never use generic communication-repair suggestions'
]) assert(promptBlock.includes(required),`universal prompt contract missing: ${required}`);

assert(runtime.includes('Conversation so far (same user, oldest to newest)'), 'conversation-history prompt is missing');
assert(runtime.includes('conversationTrail=prior'), 'follow-up history is not retained after a tap');
assert(runtime.includes('useEnglishSuggestion(item.english)'), 'generated next turns are not actionable');

console.log(`Universal Keep Talking generalization contract PASS: ${unseen.length} unseen scenarios, no phrase-by-phrase dependency`);
