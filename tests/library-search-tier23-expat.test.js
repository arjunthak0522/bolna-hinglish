const fs=require('fs');
const vm=require('vm');
global.window={};
vm.runInThisContext(fs.readFileSync('phrase-library.js','utf8'));
vm.runInThisContext(fs.readFileSync('phrase-library-expanded.js','utf8'));
const search=require('../library-search.js');
const lib=window.BOLNA_PHRASE_LIBRARY;

// Tier 2 / Tier 3 expat benchmark.
// Models how an English-speaking expat naturally thinks/types, while keeping
// Tier 2 / Tier 3 situations: utilities, local transport, repairs, home help,
// security, deliveries, markets, pharmacies, pets, and neighborhood logistics.
const cases=[
  ['how far is mall','How far is the mall?'],
  ['is mall walkable','Is the mall within walking distance?'],
  ['how far airport','How far is the airport?'],
  ['driver come main gate','Please come to the main gate.'],
  ['driver wait 10 minutes','Can you wait for ten minutes?'],
  ['please drive slower','Please drive a little slower.'],
  ['i have no cash','I do not have cash.'],
  ['i paid online already','I already paid online.'],
  ['drop me main gate','Please drop me at the main gate.'],
  ['avoid toll road','Please avoid the toll road.'],

  ['maid dont come tomorrow','You do not need to come tomorrow.'],
  ['housekeeper tomorrow off','You do not need to come tomorrow.'],
  ['maid come tomorrow afternoon','Please come in the afternoon tomorrow.'],
  ['nobody home tomorrow','Nobody will be home tomorrow.'],
  ['please clean properly','Please clean this properly.'],
  ['dont throw this away','Please do not throw this away.'],
  ['put this in fridge','Please put this in the fridge.'],
  ['wash these separately','Please wash these separately.'],
  ['use less oil','Please use less oil.'],
  ['take garbage out','Please take the garbage out.'],
  ['switch lights off','Please switch off the lights.'],
  ['lock apartment door when leaving','Please lock the door when you leave.'],

  ['ac blowing warm air','The AC is not cooling properly.'],
  ['ac not cooling','The AC is not cooling properly.'],
  ['water pressure low','The water pressure is low.'],
  ['water pressure very low','The water pressure is low.'],
  ['wifi down again','The internet is not working.'],
  ['internet not working','The internet is not working.'],
  ['electricity out again','The power keeps going out.'],
  ['electricity keeps going out','The power keeps going out.'],
  ['power keeps going out','The power keeps going out.'],
  ['kitchen sink leaking','There is a leak under the sink.'],
  ['need plumber sink leaking','There is a leak under the sink.'],
  ['toilet blocked','The toilet is blocked.'],
  ['toilet clogged','The toilet is blocked.'],
  ['can repair person come today','Can someone come today?'],
  ['what time technician coming','What time will the technician come?'],
  ['is there extra repair charge','Is there an extra charge?'],
  ['this was repaired before','This was already repaired once.'],

  ['security guard guest coming','Please let my guest in.'],
  ['let my guest in','Please let my guest in.'],
  ['dont send guest up yet','Please do not send them up yet.'],
  ['ask them to call me','Ask them to call me.'],
  ['is visitor parking available','Is visitor parking available?'],
  ['my taxi is outside','My cab is waiting outside.'],
  ['which gate is closest','Which gate is closest?'],

  ['package wrong building','You are at the wrong building.'],
  ['delivery wrong gate','You are at the wrong gate.'],
  ['package paid already','I already paid online.'],
  ['this package not mine','This is not my order.'],
  ['delivery missing one item','One item is missing.'],
  ['wrong package take it back','Please take it back.'],

  ['restaurant use less oil','Please use very little oil.'],
  ['tea no sugar','No sugar, please.'],
  ['pack leftover food','Please pack the rest.'],
  ['bring this food first','Please bring this first.'],
  ['one dish still missing','We are still waiting for one dish.'],
  ['wrong food order','This is not what we ordered.'],
  ['less salt please','Can you make this less salty?'],
  ['sauce on side','Please keep the sauce separate.'],
  ['does this have egg','Does this have egg in it?'],
  ['cooked in butter or oil','Is this cooked in butter or oil?'],

  ['price for two kilos','How much for two kilos?'],
  ['give me half kilo','Please give me half a kilo.'],
  ['this is too expensive','That is too expensive.'],
  ['are these fresh','Are these fresh?'],
  ['give me fresh ones','Please give me the fresh ones.'],
  ['thats enough','That is enough.'],
  ['no plastic bag','Please do not use a plastic bag.'],
  ['do you have change','Do you have change?'],
  ['deliver to my apartment','Can you deliver this to my house?'],
  ['nearest grocery store','Where is the nearest grocery store?'],
  ['grocery store nearby','Where is the nearest grocery store?'],

  ['pharmacy nearby','Is there a pharmacy nearby?'],
  ['medicine before or after food','Should I take this before or after food?'],
  ['medicine how often','How many times a day should I take this?'],
  ['do i need prescription','Do I need a prescription?'],
  ['doctor it hurts here','It hurts here.'],
  ['i dont have fever','I do not have a fever.'],

  ['dont feed my dog','Please do not feed her.'],
  ['dog scared of fireworks','She is scared of loud noises.'],
  ['are dogs allowed inside','Are dogs allowed inside?'],
  ['vet nearby','Is there a vet nearby?'],
  ['atm nearby','Where is the nearest ATM?'],
  ['bathroom nearby','Is there a bathroom nearby?']
];

let top1=0,top3=0;const failures=[];
for(const [q,expected] of cases){
  const results=search.rank(lib,q,'All').slice(0,3).map(x=>x.item.english);
  if(results[0]===expected)top1++;
  if(results.includes(expected))top3++;
  else failures.push({q,expected,results});
}
const total=cases.length,top1Rate=top1/total,top3Rate=top3/total;
console.log(JSON.stringify({benchmark:'tier2-tier3-expat-english',total,top1,top3,top1Rate,top3Rate,failures},null,2));
if(top3Rate<0.90)throw new Error(`Tier 2/3 expat English Top-3 accuracy ${(top3Rate*100).toFixed(1)}% is below 90%`);
