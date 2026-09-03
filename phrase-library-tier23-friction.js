(function(){
const extra=[
{category:'Apartment & maintenance',context:'Household',english:'The backup power is not working.',natural:'Backup power kaam nahin kar raha hai.',phonetic:'backup power kaam nuh-HEE(n) kur RAA-haa hai',search:'backup power inverter generator not working electricity outage building'},
{category:'Apartment & maintenance',context:'Household',english:'When will the water come back?',natural:'Paani kab wapas aayega?',phonetic:'PAA-nee kub WAA-pus AA-yay-gaa',search:'water stopped no water when back return supply'},
{category:'Apartment & maintenance',context:'Household',english:'The water has stopped.',natural:'Paani aana band ho gaya hai.',phonetic:'PAA-nee AA-naa bund hoh GU-yaa hai',search:'water stopped no water supply tap not coming'},
{category:'Apartment & maintenance',context:'Household',english:'I need an electrician today.',natural:'Mujhe aaj electrician chahiye.',phonetic:'moo-jhay aaj electrician CHAA-hee-yay',search:'need electrician today electrical repair urgent'},
{category:'Apartment & maintenance',context:'Household',english:'I need a plumber today.',natural:'Mujhe aaj plumber chahiye.',phonetic:'moo-jhay aaj plumber CHAA-hee-yay',search:'need plumber today plumbing water repair urgent'},
{category:'Apartment & maintenance',context:'Household',english:'The refrigerator is not working.',natural:'Fridge kaam nahin kar raha hai.',phonetic:'fridge kaam nuh-HEE(n) kur RAA-haa hai',search:'refrigerator fridge broken not working appliance repair'},
{category:'Apartment & maintenance',context:'Household',english:'The washing machine is not working.',natural:'Washing machine kaam nahin kar rahi hai.',phonetic:'washing machine kaam nuh-HEE(n) kur RAA-hee hai',search:'washing machine washer broken not working appliance repair'},
{category:'Apartment & maintenance',context:'Household',english:'The road outside is flooded.',natural:'Bahar road par paani bhara hua hai.',phonetic:'bu-HAAR road pur PAA-nee BHU-raa hoo-aa hai',search:'road outside flooded flooding waterlogged waterlogging rain monsoon building'},

{category:'Getting around',context:'Driver',english:'Can you come another way?',natural:'Kya aap doosre raaste se aa sakte hain?',phonetic:'kyaa aap DOOS-ray RAA-stay say aa SUK-tay hai(n)',search:'driver another way alternate route road blocked flooded cannot reach'},
{category:'Getting around',context:'Driver',english:'Please call me when you reach.',natural:'Pahunch ke mujhe call kar dena.',phonetic:'pu-HOONCH kay moo-jhay call kur DAY-naa',search:'driver call when reach arrive pickup'},
{category:'Getting around',context:'Driver',english:'I am outside the building.',natural:'Main building ke bahar hoon.',phonetic:'mai(n) building kay bu-HAAR hoo(n)',search:'driver outside building waiting pickup location'},
{category:'Getting around',context:'Driver',english:'The driver cannot find my building.',natural:'Driver ko meri building nahin mil rahi hai.',phonetic:'driver koh MAY-ree building nuh-HEE(n) mil RAA-hee hai',search:'driver cannot find building lost location address apartment'},

{category:'Doctor & pharmacy',context:'Pharmacy',english:'Do you have another brand of this medicine?',natural:'Is medicine ka doosra brand hai?',phonetic:'iss medicine kaa DOOS-raa brand hai',search:'pharmacy medicine another brand alternative substitute'},
{category:'Doctor & pharmacy',context:'Pharmacy',english:'When will this medicine be available?',natural:'Yeh medicine kab milegi?',phonetic:'yay medicine kub mi-LAY-gee',search:'pharmacy medicine unavailable out of stock when available'},
{category:'Doctor & pharmacy',context:'Pharmacy',english:'Can you deliver the medicine to my apartment?',natural:'Medicine mere flat pe deliver kar sakte hain?',phonetic:'medicine MAY-ray flat pay deliver kur SUK-tay hai(n)',search:'pharmacy medicine deliver apartment home delivery'},
{category:'Doctor & pharmacy',context:'Pharmacy',english:'Please call me if you find this medicine.',natural:'Yeh medicine mile to mujhe call kar dijiye.',phonetic:'yay medicine mi-LAY toh moo-jhay call kur DEE-jee-yay',search:'pharmacy medicine find call notify available'},

{category:'Security & visitors',context:'Security',english:'The delivery person cannot find the building.',natural:'Delivery wale ko building nahin mil rahi hai.',phonetic:'delivery WAA-lay koh building nuh-HEE(n) mil RAA-hee hai',search:'delivery person cannot find building lost address security guard'},
{category:'Security & visitors',context:'Security',english:'Someone is parked in my spot.',natural:'Koi meri parking spot mein gaadi laga ke gaya hai.',phonetic:'koy MAY-ree parking spot may(n) GAA-dee lu-GAA kay GU-yaa hai',search:'someone parked my spot parking space blocked car'},

{category:'Shopping & payments',context:'Shopkeeper',english:'Do you have a cheaper option?',natural:'Koi sasta option hai?',phonetic:'koy SUS-taa option hai',search:'cheaper option lower price alternative affordable shop'},
{category:'Shopping & payments',context:'Shopkeeper',english:'Where exactly is your shop?',natural:'Aapki shop exactly kahan hai?',phonetic:'AAP-kee shop exactly ku-HAAN hai',search:'where exactly shop store location directions find'},

{category:'Friends & everyday',context:'Everyday',english:'Please speak a little slower.',natural:'Thoda dheere boliye, please.',phonetic:'THOH-daa DHEE-ray BOH-lee-yay, please',search:'speak slower slow down talking understand hindi'},
{category:'Friends & everyday',context:'Everyday',english:'I understand a little Hindi.',natural:'Mujhe thodi Hindi samajh aati hai.',phonetic:'moo-jhay THOH-dee Hindi su-MUJH AA-tee hai',search:'understand little hindi some hindi language'},
{category:'Friends & everyday',context:'Everyday',english:'Can you say that again?',natural:'Ek baar phir boliye.',phonetic:'ayk baar fir BOH-lee-yay',search:'say again repeat please did not understand'},
{category:'Friends & everyday',context:'Everyday',english:'Please explain it simply.',natural:'Please simple tareeke se samjhaiye.',phonetic:'please simple tu-REE-kay say sum-JHAA-ee-yay',search:'explain simply simple words understand clarify'}
];
if(Array.isArray(window.BOLNA_PHRASE_LIBRARY))window.BOLNA_PHRASE_LIBRARY.push(...extra);
})();
