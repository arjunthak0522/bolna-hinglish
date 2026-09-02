const fs=require('fs');
const vm=require('vm');
global.window={};
vm.runInThisContext(fs.readFileSync('phrase-library.js','utf8'));
vm.runInThisContext(fs.readFileSync('phrase-library-expanded.js','utf8'));
const search=require('../library-search.js');
const lib=window.BOLNA_PHRASE_LIBRARY;
const cases=[
['mall dist','How far is the mall?'],['mall walki','Is the mall within walking distance?'],['airprt far','How far is the airport?'],
['driver ga','Please come to the main gate.'],['cab main ga','Please come to the main gate.'],['uber wait 5','Please wait here for five minutes.'],['driver slo','Please drive a little slower.'],['cab no cas','I do not have cash.'],
['maid tom','You do not need to come tomorrow.'],['maid skip tomorrow','You do not need to come tomorrow.'],['cleaner tom no','You do not need to come tomorrow.'],['maid afternoon tom','Please come in the afternoon tomorrow.'],['maid clean prop','Please clean this properly.'],['trash out','Please take the garbage out.'],
['ac warm','The AC is not cooling properly.'],['ac not col','The AC is not cooling properly.'],['water weak','The water pressure is low.'],['wifi brok','The internet is not working.'],['internet down','The internet is not working.'],['light keeps gone','The power keeps going out.'],['power going','The power keeps going out.'],['sink leaking','There is a leak under the sink.'],['toilet clogg','The toilet is blocked.'],['maintnance today','Can someone come today?'],['plumbr leak','Can you send a plumber?'],
['guard guest','Please let my guest in.'],['watchman guest in','Please let my guest in.'],['guest coming allow','Please let my guest in.'],['visitor park','Is visitor parking available?'],
['delivery wrong bldg','You are at the wrong building.'],['courier wrong gate','You are at the wrong gate.'],['delivery missing','One item is missing.'],['swiggy missing item','One item is missing.'],['zomato wrong order','This is not what we ordered.'],
['resturant mild','Please make it a little less spicy.'],['food less hot','Please make it a little less spicy.'],['tea no sug','No sugar, please.'],['pack leftov','Please pack the rest.'],['dish still waiting','We are still waiting for one dish.'],
['2 kg cost','How much for two kilos?'],['500 gram','Please give me half a kilo.'],['veg too costly','That is too expensive.'],['produce fresh?','Are these fresh?'],['upi pay','Can I pay by UPI?'],['cash change','Do you have change?'],
['med after food','Should I take this before or after food?'],['tablet empty stomach','Should I take this before or after food?'],['medecine frequency','How many times a day should I take this?'],['chemist prescription','Do I need a prescription?'],
['running late','I am running a little late.'],['wash iron','Please wash and iron these.'],['barber not short','Please do not cut it too short.'],
['dog no fud','Please do not feed her.'],['pet dont feed','Please do not feed her.'],['dog crackers scared','She is scared of loud noises.'],['pet fireworks','She is scared of loud noises.'],['dog allowed in','Are dogs allowed inside?'],['vet near','Is there a vet nearby?'],
['atm near','Where is the nearest ATM?'],['closest atm','Where is the nearest ATM?'],['grocry near','Where is the nearest grocery store?'],['supermarket close','Where is the nearest grocery store?'],['bathrom near','Is there a bathroom nearby?'],['toilet closest','Is there a bathroom nearby?']
];
let top1=0,top3=0;const failures=[];
for(const [q,expected] of cases){const results=search.rank(lib,q,'All').slice(0,3).map(x=>x.item.english);if(results[0]===expected)top1++;if(results.includes(expected))top3++;else failures.push({q,expected,results});}
const total=cases.length,top1Rate=top1/total,top3Rate=top3/total;
console.log(JSON.stringify({benchmark:'messy-expat-predictive',total,top1,top3,top1Rate,top3Rate,failures},null,2));
if(top3Rate<0.90)throw new Error(`Messy expat Top-3 accuracy ${(top3Rate*100).toFixed(1)}% is below 90%`);
