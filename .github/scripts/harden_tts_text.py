from pathlib import Path
p=Path('app-runtime.js')
s=p.read_text()

# Add canonical speech helper near infer/remember area.
anchor="function infer(t){t=t.toLowerCase();"
helper="function canonicalSpeechText(x){return String(x?.spokenForm||x?.natural||'').trim()}\n"
if helper not in s:
    if anchor not in s: raise SystemExit('infer anchor not found')
    s=s.replace(anchor,helper+anchor,1)

# Voice result: override any model-supplied speechText with generated Hinglish.
old="result={...d,polite:'',casual:'',moreHindi:'',words:[],_enriched:false,_audioState:'loading'};delete result.transcript;state='ready';remember();render();void prefetchVoice(result.speechText)"
new="result={...d,polite:'',casual:'',moreHindi:'',words:[],_enriched:false,_audioState:'loading'};delete result.transcript;result.speechText=canonicalSpeechText(result);state='ready';remember();render();void prefetchVoice(result.speechText)"
if old not in s: raise SystemExit('voice result anchor not found')
s=s.replace(old,new,1)

# Typed core result: same rule.
old="result={...d,polite:'',casual:'',moreHindi:'',words:[],_enriched:false};state='ready';remember();render();prefetchVoice(result.speechText)"
new="result={...d,polite:'',casual:'',moreHindi:'',words:[],_enriched:false};result.speechText=canonicalSpeechText(result);state='ready';remember();render();prefetchVoice(result.speechText)"
# replace all typed/context/situation occurrences safely
if old not in s: raise SystemExit('core result anchor not found')
s=s.replace(old,new)

# Result playback should always derive fresh canonical Hinglish text, not trust stored speechText.
s=s.replace("document.getElementById('hear').onclick=()=>playText(result.speechText,false);", "document.getElementById('hear').onclick=()=>playText(canonicalSpeechText(result),false);")
s=s.replace("document.getElementById('slow').onclick=()=>playText(result.speechText,true);", "document.getElementById('slow').onclick=()=>playText(canonicalSpeechText(result),true);")

# Remember/save canonical speech text only.
s=s.replace("a.unshift({natural:result.natural,phonetic:result.phonetic,speechText:result.speechText,english:transcript,context,ts:Date.now()});", "a.unshift({natural:result.natural,phonetic:result.phonetic,speechText:canonicalSpeechText(result),english:transcript,context,ts:Date.now()});")
s=s.replace("a.unshift({natural:result.natural,phonetic:result.phonetic,speechText:result.speechText,english:transcript,context});", "a.unshift({natural:result.natural,phonetic:result.phonetic,speechText:canonicalSpeechText(result),english:transcript,context});")

# Stored phrase playback falls back to natural if legacy speechText is bad/missing.
s=s.replace("playText(x.speechText,false)", "playText(String(x.natural||x.speechText||'').trim(),false)")

# Tighten prompts so provider output is also consistent, though client no longer trusts it.
s=s.replace("The phonetic field is critical and must be usable even when audio is unavailable.\nReturn only requested JSON.", "The phonetic field is critical and must be usable even when audio is unavailable. speechText MUST be the generated Hinglish phrase to speak, never the English transcript.\nReturn only requested JSON.")
s=s.replace("Return CORE only: natural, spokenForm, phonetic, meaning, speechText, confidence, phoneticConfidence. Do not generate variants or breakdowns.", "Return CORE only: natural, spokenForm, phonetic, meaning, speechText, confidence, phoneticConfidence. speechText MUST be the Hinglish phrase to speak, never the English input. Do not generate variants or breakdowns.")

p.write_text(s)
