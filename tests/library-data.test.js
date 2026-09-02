const fs=require('fs');
const vm=require('vm');
const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('phrase-library.js','utf8'),sandbox);
vm.runInContext(fs.readFileSync('phrase-library-expanded.js','utf8'),sandbox);
const rows=sandbox.window.BOLNA_PHRASE_LIBRARY;
if(!Array.isArray(rows)||rows.length<170)throw new Error(`Expected at least 170 vetted phrases, got ${rows?.length}`);
const required=['category','context','english','natural','phonetic'];
for(const [i,x] of rows.entries()){
  for(const k of required)if(typeof x[k]!=='string'||!x[k].trim())throw new Error(`Row ${i} missing ${k}`);
  if(/[\u0900-\u097F]/.test(x.phonetic))throw new Error(`Row ${i} phonetic contains Devanagari`);
  if(/[\u0900-\u097F]/.test(x.natural))throw new Error(`Row ${i} Hinglish contains Devanagari`);
}
const keys=rows.map(x=>`${x.context}|${x.natural}`.toLowerCase());
if(new Set(keys).size!==keys.length)throw new Error('Duplicate context/natural phrase found');
const mustHave=['UPI chalega?','Gate pe chhod dena.','Bhaiya, bas yahin rok dena.','Thoda kam spicy karna, please.','Kal subah aa jaiye.','Mall kitni door hai?','Kal aane ki zaroorat nahin hai.','Please usko kuch mat khilana.'];
for(const phrase of mustHave)if(!rows.some(x=>x.natural===phrase))throw new Error(`Missing core everyday phrase: ${phrase}`);
console.log(`Library data checks passed: ${rows.length} phrases across ${new Set(rows.map(x=>x.category)).size} categories`);
