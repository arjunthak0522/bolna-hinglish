const fs=require('fs');
const vm=require('vm');
const code=fs.readFileSync('phrase-library.js','utf8');
const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(code,sandbox);
const rows=sandbox.window.BOLNA_PHRASE_LIBRARY;
if(!Array.isArray(rows)||rows.length<60)throw new Error(`Expected at least 60 vetted phrases, got ${rows?.length}`);
const required=['category','context','english','natural','phonetic'];
for(const [i,x] of rows.entries()){
  for(const k of required)if(typeof x[k]!=='string'||!x[k].trim())throw new Error(`Row ${i} missing ${k}`);
  if(/[\u0900-\u097F]/.test(x.phonetic))throw new Error(`Row ${i} phonetic contains Devanagari`);
}
const keys=rows.map(x=>`${x.context}|${x.natural}`.toLowerCase());
if(new Set(keys).size!==keys.length)throw new Error('Duplicate context/natural phrase found');
const mustHave=['UPI chalega?','Gate pe chhod dena.','Bhaiya, bas yahin rok dena.','Thoda kam spicy karna, please.','Kal subah aa jaiye.'];
for(const phrase of mustHave)if(!rows.some(x=>x.natural===phrase))throw new Error(`Missing core expat phrase: ${phrase}`);
console.log(`Library data checks passed: ${rows.length} phrases across ${new Set(rows.map(x=>x.category)).size} categories`);
