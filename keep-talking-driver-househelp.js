(() => {
  const kt=window.BOLNA_KEEP_TALKING;
  if(!kt)return;
  const g=kt.CONVERSATION_GRAPH;
  Object.assign(g,{
    'what time will you come?':{scenario:'driver-pickup',partner:'driver',phase:'schedule',owner:'them',next:['Please come at eight.','Please come ten minutes early.','Let me know when you are downstairs.']},
    'please come at eight.':{scenario:'driver-pickup',partner:'driver',phase:'schedule',owner:'them',next:['Please come ten minutes early.','Let me know when you are downstairs.','Please wait near the entrance.']},
    'let me know when you are downstairs.':{scenario:'driver-pickup',partner:'driver',phase:'arrival',owner:'them',next:['Please wait near the entrance.','Please bring the car around.','I will message you when I am ready.']},
    'please wait near the entrance.':{scenario:'driver-pickup',partner:'driver',phase:'wait',owner:'them',next:['Please wait in the car.','I will message you when I am ready.','Please do not leave yet.']},
    'please stop at the petrol pump.':{scenario:'driver-fuel',partner:'driver',phase:'fuel',owner:'them',next:['Please fill the tank.','Please check the tyre pressure.','I transferred your payment.']},
    'please fill the tank.':{scenario:'driver-fuel',partner:'driver',phase:'fuel',owner:'them',next:['Please check the tyre pressure.','I transferred your payment.']},
    'we have one more stop.':{scenario:'driver-errands',partner:'driver',phase:'route',owner:'them',next:['First go to the pharmacy.','Please stop at the grocery store.','After that, go home.']},
    'first go to the pharmacy.':{scenario:'driver-errands',partner:'driver',phase:'route',owner:'them',next:['Please stop at the grocery store.','After that, go home.']},
    'please drive carefully.':{scenario:'driver-safety',partner:'driver',phase:'safety',owner:'them',next:['Please do not overtake so much.','Please avoid the rough road.','Please follow Google Maps.']},
    'are you coming today?':{scenario:'househelp-attendance',partner:'househelp',phase:'confirm',owner:'them',next:['What time are you coming today?','Please tell me if you are running late.','Please tell me in advance if you cannot come.']},
    'what time are you coming today?':{scenario:'househelp-attendance',partner:'househelp',phase:'schedule',owner:'them',next:['Please come by nine.','Please tell me if you are running late.','Please tell me in advance if you cannot come.']},
    'please tell me if you are running late.':{scenario:'househelp-attendance',partner:'househelp',phase:'expectation',owner:'them',next:['Please tell me in advance if you cannot come.','What time are you coming today?']},
    'please sweep and mop the floor.':{scenario:'househelp-cleaning',partner:'househelp',phase:'cleaning',owner:'them',next:['Please use less water when mopping.','Please clean under the sofa.','Please clean under the bed.']},
    'please clean the kitchen first.':{scenario:'househelp-cleaning',partner:'househelp',phase:'priority',owner:'them',next:['Please finish the kitchen before you leave.','Please clean the bathroom properly.','Please take the trash out.']},
    'please use this cleaner.':{scenario:'househelp-cleaning',partner:'househelp',phase:'product',owner:'them',next:['Please clean the bathroom properly.','Please do not use bleach on this.','Please clean under the sofa.']},
    'what are you cooking today?':{scenario:'cook-meal',partner:'cook',phase:'plan',owner:'them',next:['Please make dal, rice, and one vegetable.','Please use less oil.','Please make enough for dinner too.']},
    'please make dal, rice, and one vegetable.':{scenario:'cook-meal',partner:'cook',phase:'customize',owner:'them',next:['Please use less oil.','Please use less salt.','Please make it less spicy.']},
    'please use less oil.':{scenario:'cook-meal',partner:'cook',phase:'customize',owner:'them',next:['Please use less salt.','Please make it less spicy.','Please do not add ghee.']},
    'please make enough for dinner too.':{scenario:'cook-leftovers',partner:'cook',phase:'store',owner:'them',next:['Please save the leftovers.','Please put the food in the fridge.','Please do not throw away the leftovers.']},
    'please wash the vegetables first.':{scenario:'cook-prep',partner:'cook',phase:'prep',owner:'them',next:['Please use filtered water for cooking.','What are you cooking today?','Please make dal, rice, and one vegetable.']},
    'please use filtered water for cooking.':{scenario:'cook-prep',partner:'cook',phase:'prep',owner:'them',next:['Please make dal, rice, and one vegetable.','Please make enough for dinner too.','Please turn off the gas when you finish.']},
    'please turn off the gas when you finish.':{scenario:'cook-safety',partner:'cook',phase:'finish',owner:'them',next:['Please lock the door when you leave.','Please leave the key with security.','Please call me if there is any problem.']},
    'what groceries are running low?':{scenario:'household-groceries',partner:'househelp',phase:'inventory',owner:'them',next:['Please make a grocery list.','Please tell me before something runs out.']},
    'please make a grocery list.':{scenario:'household-groceries',partner:'househelp',phase:'inventory',owner:'them',next:['Please tell me before something runs out.','What groceries are running low?']}
  });
  kt.ROUGH_ROUTES.unshift(
    [/\b(driver|chauffeur)\b.*\b(what time|when)\b.*\b(come|coming|arrive)\b/i,'what time will you come?'],
    [/\b(driver|car)\b.*\b(petrol|fuel|gas station|petrol pump)\b/i,'please stop at the petrol pump.'],
    [/\b(one more|another)\b.*\b(stop|errand)\b/i,'we have one more stop.'],
    [/\b(driver|car|gaadi)\b.*\b(careful|safe|safely|overtake|dangerous)\b/i,'please drive carefully.'],
    [/\b(maid|bai|househelp|house help|didi|cook)\b.*\b(coming|come)\b.*\b(today)\b/i,'are you coming today?'],
    [/\b(maid|bai|househelp|house help)\b.*\b(sweep|mop|jhaadu|jhadu|pocha)\b/i,'please sweep and mop the floor.'],
    [/\b(maid|bai|househelp|house help)\b.*\b(cleaner|cleaning product)\b/i,'please use this cleaner.'],
    [/\b(cook|cooking)\b.*\b(what|meal|today)\b/i,'what are you cooking today?'],
    [/\b(cook|food)\b.*\b(less oil|oil less)\b/i,'please use less oil.'],
    [/\b(cook|vegetable|vegetables|sabzi)\b.*\b(wash|rinse|clean)\b/i,'please wash the vegetables first.'],
    [/\b(cook|cooking|food)\b.*\b(filtered water|ro water)\b/i,'please use filtered water for cooking.'],
    [/\b(cook|gas|stove)\b.*\b(off|turn off|band)\b/i,'please turn off the gas when you finish.'],
    [/\b(grocery|groceries|supplies)\b.*\b(low|running out|need|finish)\b/i,'what groceries are running low?']
  );
})();
