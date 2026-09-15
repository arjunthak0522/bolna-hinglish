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
    'are you coming today?':{scenario:'househelp-attendance',partner:'househelp',phase:'confirm',owner:'them',next:['What time are you coming today?','Please tell me if you are running late.','Please tell me in advance if you cannot come.']},
    'what time are you coming today?':{scenario:'househelp-attendance',partner:'househelp',phase:'schedule',owner:'them',next:['Please come by nine.','Please tell me if you are running late.','Please tell me in advance if you cannot come.']},
    'please tell me if you are running late.':{scenario:'househelp-attendance',partner:'househelp',phase:'expectation',owner:'them',next:['Please tell me in advance if you cannot come.','What time are you coming today?']},
    'please sweep and mop the floor.':{scenario:'househelp-cleaning',partner:'househelp',phase:'cleaning',owner:'them',next:['Please use less water when mopping.','Please clean under the sofa.','Please clean under the bed.']},
    'please clean the kitchen first.':{scenario:'househelp-cleaning',partner:'househelp',phase:'priority',owner:'them',next:['Please finish the kitchen before you leave.','Please clean the bathroom properly.','Please take the trash out.']},
    'what are you cooking today?':{scenario:'cook-meal',partner:'cook',phase:'plan',owner:'them',next:['Please make dal, rice, and one vegetable.','Please use less oil.','Please make enough for dinner too.']},
    'please make dal, rice, and one vegetable.':{scenario:'cook-meal',partner:'cook',phase:'customize',owner:'them',next:['Please use less oil.','Please use less salt.','Please make it less spicy.']},
    'please use less oil.':{scenario:'cook-meal',partner:'cook',phase:'customize',owner:'them',next:['Please use less salt.','Please make it less spicy.','Please do not add ghee.']},
    'please make enough for dinner too.':{scenario:'cook-leftovers',partner:'cook',phase:'store',owner:'them',next:['Please save the leftovers.','Please put the food in the fridge.','Please do not throw away the leftovers.']},
    'what groceries are running low?':{scenario:'household-groceries',partner:'househelp',phase:'inventory',owner:'them',next:['Please make a grocery list.','Please tell me before something runs out.']},
    'please make a grocery list.':{scenario:'household-groceries',partner:'househelp',phase:'inventory',owner:'them',next:['Please tell me before something runs out.','What groceries are running low?']}
  });
  kt.ROUGH_ROUTES.unshift(
    [/\b(driver|chauffeur)\b.*\b(what time|when)\b.*\b(come|coming|arrive)\b/i,'what time will you come?'],
    [/\b(driver|car)\b.*\b(petrol|fuel|gas station|petrol pump)\b/i,'please stop at the petrol pump.'],
    [/\b(one more|another)\b.*\b(stop|errand)\b/i,'we have one more stop.'],
    [/\b(maid|bai|househelp|house help|didi|cook)\b.*\b(coming|come)\b.*\b(today)\b/i,'are you coming today?'],
    [/\b(maid|bai|househelp|house help)\b.*\b(sweep|mop|jhaadu|jhadu|pocha)\b/i,'please sweep and mop the floor.'],
    [/\b(cook|cooking)\b.*\b(what|meal|today)\b/i,'what are you cooking today?'],
    [/\b(cook|food)\b.*\b(less oil|oil less)\b/i,'please use less oil.'],
    [/\b(grocery|groceries|supplies)\b.*\b(low|running out|need|finish)\b/i,'what groceries are running low?']
  );
})();
