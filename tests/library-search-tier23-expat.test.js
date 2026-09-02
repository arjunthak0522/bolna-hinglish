const fs=require('fs');
const vm=require('vm');
global.window={};
vm.runInThisContext(fs.readFileSync('phrase-library.js','utf8'));
vm.runInThisContext(fs.readFileSync('phrase-library-expanded.js','utf8'));
const search=require('../library-search.js');
const lib=window.BOLNA_PHRASE_LIBRARY;

// Tier 2 / Tier 3 expat panel benchmark.
// Deliberately uses Indian-English, incomplete wording, typos, and local-service shorthand.
const cases=[
  ['mall kitna far','How far is the mall?'],
  ['mall walkable?','Is the mall within walking distance?'],
  ['airport kitna far','How far is the airport?'],
  ['auto main gate','Please come to the main gate.'],
  ['auto wait 10','Can you wait for ten minutes?'],
  ['auto slowly','Please drive a little slower.'],
  ['driver no cash','I do not have cash.'],
  ['driver paid online','I already paid online.'],
  ['drop main gate','Please drop me at the main gate.'],
  ['avoid toll naka','Please avoid the toll road.'],

  ['maid kal cancel','You do not need to come tomorrow.'],
  ['house help tomorrow off','You do not need to come tomorrow.'],
  ['maid kal afternoon','Please come in the afternoon tomorrow.'],
  ['kal nobody flat','Nobody will be home tomorrow.'],
  ['maid clean properly','Please clean this properly.'],
  ['dont throw this maid','Please do not throw this away.'],
  ['keep fridge','Please put this in the fridge.'],
  ['wash separately clothes','Please wash these separately.'],
  ['cook less oil','Please use less oil.'],
  ['kachra take out','Please take the garbage out.'],
  ['switch lights off','Please switch off the lights.'],
  ['lock flat door leaving','Please lock the door when you leave.'],

  ['ac garam air','The AC is not cooling properly.'],
  ['ac not cooling','The AC is not cooling properly.'],
  ['tap pressure less','The water pressure is low.'],
  ['water pressure very low','The water pressure is low.'],
  ['wifi down again','The internet is not working.'],
  ['broadband not working','The internet is not working.'],
  ['light gone again','The power keeps going out.'],
  ['current gone again','The power keeps going out.'],
  ['bijli keeps going','The power keeps going out.'],
  ['kitchen sink leak','There is a leak under the sink.'],
  ['plumber sink leaking','There is a leak under the sink.'],
  ['toilet jammed','The toilet is blocked.'],
  ['toilet clogged','The toilet is blocked.'],
  ['repair guy today','Can someone come today?'],
  ['technician kab come','What time will the technician come?'],
  ['repair extra charge','Is there an extra charge?'],
  ['already repaired before','This was already repaired once.'],

  ['watchman guest coming','Please let my guest in.'],
  ['security guest allow','Please let my guest in.'],
  ['watchman dont send up','Please do not send them up yet.'],
  ['guard ask call me','Ask them to call me.'],
  ['guest car parking','Is visitor parking available?'],
  ['my auto outside','My cab is waiting outside.'],
  ['which gate nearest','Which gate is closest?'],

  ['parcel wrong building','You are at the wrong building.'],
  ['courier wrong gate','You are at the wrong gate.'],
  ['parcel paid already','I already paid online.'],
  ['parcel not mine','This is not my order.'],
  ['delivery one missing','One item is missing.'],
  ['wrong parcel take back','Please take it back.'],

  ['dhaba less oil','Please use very little oil.'],
  ['chai no sugar','No sugar, please.'],
  ['pack remaining food','Please pack the rest.'],
  ['bring this first food','Please bring this first.'],
  ['one dish still not come','We are still waiting for one dish.'],
  ['wrong food order','This is not what we ordered.'],
  ['less salt please','Can you make this less salty?'],
  ['sauce side separate','Please keep the sauce separate.'],
  ['egg inside?','Does this have egg in it?'],
  ['butter or oil cooked','Is this cooked in butter or oil?'],

  ['sabzi 2 kilo price','How much for two kilos?'],
  ['sabzi half kilo','Please give me half a kilo.'],
  ['market too costly','That is too expensive.'],
  ['sabzi fresh?','Are these fresh?'],
  ['give fresh ones','Please give me the fresh ones.'],
  ['bas enough','That is enough.'],
  ['no plastic bag','Please do not use a plastic bag.'],
  ['cash change hai?','Do you have change?'],
  ['deliver to flat','Can you deliver this to my house?'],
  ['kirana nearby','Where is the nearest grocery store?'],
  ['ration shop nearby','Where is the nearest grocery store?'],

  ['chemist nearby','Is there a pharmacy nearby?'],
  ['tablet before after food','Should I take this before or after food?'],
  ['medicine kitni baar','How many times a day should I take this?'],
  ['chemist prescription needed','Do I need a prescription?'],
  ['doctor pain here','It hurts here.'],
  ['no fever doctor','I do not have a fever.'],

  ['dog dont feed','Please do not feed her.'],
  ['dog crackers scared','She is scared of loud noises.'],
  ['dog allowed inside','Are dogs allowed inside?'],
  ['vet nearby','Is there a vet nearby?'],
  ['atm nearby','Where is the nearest ATM?'],
  ['washroom nearby','Is there a bathroom nearby?']
];

let top1=0,top3=0;const failures=[];
for(const [q,expected] of cases){
  const results=search.rank(lib,q,'All').slice(0,3).map(x=>x.item.english);
  if(results[0]===expected)top1++;
  if(results.includes(expected))top3++;
  else failures.push({q,expected,results});
}
const total=cases.length,top1Rate=top1/total,top3Rate=top3/total;
console.log(JSON.stringify({benchmark:'tier2-tier3-expat',total,top1,top3,top1Rate,top3Rate,failures},null,2));
if(top3Rate<0.90)throw new Error(`Tier 2/3 expat Top-3 accuracy ${(top3Rate*100).toFixed(1)}% is below 90%`);
