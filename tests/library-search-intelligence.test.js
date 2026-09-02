const fs=require('fs');
const vm=require('vm');
global.window={};
vm.runInThisContext(fs.readFileSync('phrase-library.js','utf8'));
vm.runInThisContext(fs.readFileSync('phrase-library-expanded.js','utf8'));
const search=require('../library-search.js');
const lib=window.BOLNA_PHRASE_LIBRARY;
if(!Array.isArray(lib)||lib.length<170)throw new Error(`expanded library too small: ${lib?.length}`);
const cases=[
  [['mall distance','distance mall','mall far'],'How far is the mall?'],
  [['mall walking','walk to mall','mall on foot'],'Is the mall within walking distance?'],
  [['airport distance','airport far','how far airport'],'How far is the airport?'],
  [['cab wait','driver wait','taxi wait'],'Please wait here for five minutes.'],
  [['cab gate','driver main gate','taxi pickup gate'],'Please come to the main gate.'],
  [['driver slow','cab slower','taxi drive slow'],'Please drive a little slower.'],
  [['no cash cab','driver cash no','taxi no cash'],'I do not have cash.'],
  [['maid tomorrow no come','cleaner cancel tomorrow','house help tomorrow cancel'],'You do not need to come tomorrow.'],
  [['maid tomorrow afternoon','cleaner afternoon tomorrow','house help tomorrow afternoon'],'Please come in the afternoon tomorrow.'],
  [['maid clean properly','cleaner thoroughly','house help proper clean'],'Please clean this properly.'],
  [['garbage out','trash take out','rubbish outside'],'Please take the garbage out.'],
  [['ac not cold','air conditioner not cooling','ac cooling problem'],'The AC is not cooling properly.'],
  [['water pressure','tap pressure low','weak water pressure'],'The water pressure is low.'],
  [['wifi broken','internet not working','wi fi problem'],'The internet is not working.'],
  [['power going out','electricity keeps going','light outage'],'The power keeps going out.'],
  [['sink leak','leak under sink','kitchen water leak'],'There is a leak under the sink.'],
  [['toilet blocked','bathroom clogged','washroom toilet problem'],'The toilet is blocked.'],
  [['repair today','maintenance today','technician come today'],'Can someone come today?'],
  [['guest let in','visitor allow','security guest enter'],'Please let my guest in.'],
  [['visitor parking','guest parking','parking visitor'],'Is visitor parking available?'],
  [['delivery wrong building','courier wrong building','package wrong building'],'You are at the wrong building.'],
  [['delivery missing item','order item missing','package incomplete'],'One item is missing.'],
  [['restaurant less spicy','food not spicy','less chili'],'Please make it a little less spicy.'],
  [['restaurant no sugar','tea no sugar','coffee without sugar'],'No sugar, please.'],
  [['pack leftovers','restaurant pack rest','takeaway leftovers'],'Please pack the rest.'],
  [['wrong restaurant order','food wrong order','not what ordered'],'This is not what we ordered.'],
  [['2kg price','two kilos cost','two kg how much'],'How much for two kilos?'],
  [['half kilo','500 grams','give half kg'],'Please give me half a kilo.'],
  [['vegetables expensive','produce too expensive','veggies price high'],'That is too expensive.'],
  [['fresh vegetables','old vegetables','produce quality'],'Are these fresh?'],
  [['upi payment','pay upi','upi accepted'],'Can I pay by UPI?'],
  [['change cash','do you have change','small notes change'],'Do you have change?'],
  [['medicine after food','tablet before food','medicine before after food'],'Should I take this before or after food?'],
  [['medicine times day','tablet frequency','dose how many times'],'How many times a day should I take this?'],
  [['pharmacy prescription','chemist prescription','medicine prescription needed'],'Do I need a prescription?'],
  [['friend running late','late arriving','little late'],'I am running a little late.'],
  [['laundry wash iron','wash and press clothes','clothes iron wash'],'Please wash and iron these.'],
  [['haircut not short','barber too short','hair do not cut short'],'Please do not cut it too short.'],
  [['need plumber','send plumber','plumber water repair'],'Can you send a plumber?'],
  [['dog no food','pet do not feed','dont feed dog'],'Please do not feed her.'],
  [['dog loud noise','pet scared noise','dog afraid fireworks'],'She is scared of loud noises.'],
  [['dog allowed inside','pets allowed','can dog come inside'],'Are dogs allowed inside?'],
  [['vet nearby','dog doctor nearby','pet veterinarian'],'Is there a vet nearby?'],
  [['atm nearby','closest atm','cash machine near'],'Where is the nearest ATM?'],
  [['grocery nearby','closest supermarket','nearest grocery'],'Where is the nearest grocery store?'],
  [['bathroom nearby','toilet near','restroom closest'],'Is there a bathroom nearby?']
];
let total=0,top1=0,top3=0;
const failures=[];
for(const [queries,expected] of cases){
  for(const q of queries){
    total++;
    const results=search.rank(lib,q,'All').slice(0,3).map(x=>x.item.english);
    if(results[0]===expected)top1++;
    if(results.includes(expected))top3++;else failures.push({q,expected,results});
  }
}
const top3Rate=top3/total;
console.log(JSON.stringify({phrases:lib.length,total,top1,top3,top1Rate:top1/total,top3Rate,failures},null,2));
if(top3Rate<0.90)throw new Error(`Top-3 search accuracy ${(top3Rate*100).toFixed(1)}% is below 90%`);
