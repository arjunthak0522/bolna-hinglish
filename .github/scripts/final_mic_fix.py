from pathlib import Path
import subprocess

BASE='5100f32115b31e74fafe17984f91d48ab402534d'

def git_show(path):
    return subprocess.check_output(['git','show',f'{BASE}:{path}'], text=True)

# Restore the exact accepted runtime, then apply only the minimal fresh-mic warmup + empty-capture recovery.
app = git_show('app-runtime.js')
old = "micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});localStorage.setItem('bolna_mic_setup_done','1');"
new = "micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});await new Promise(r=>setTimeout(r,180));localStorage.setItem('bolna_mic_setup_done','1');"
if old not in app:
    raise SystemExit('fresh mic acquisition anchor not found')
app = app.replace(old, new, 1)
old = "if(b.size<256){error={title:'I didn’t hear any speech',detail:'Try again and start speaking after the microphone begins listening.'};state='idle';return render()}"
new = "if(b.size<256){note('microphone',{phase:'empty_recording',bytes:b.size});releaseMicrophone();error={title:'Microphone wasn’t ready',detail:'Safari did not deliver audio that time. The microphone has been reset and is ready for the next tap.'};state='idle';return render()}"
if old not in app:
    raise SystemExit('empty recording anchor not found')
app = app.replace(old, new, 1)
Path('app-runtime.js').write_text(app)

# Restore the original healthy mic regression test. Experimental muted-track test is removed.
Path('tests/microphone.spec.js').write_text(git_show('tests/microphone.spec.js'))

# Update only stale TTS assertions to the current background-prefetch UX.
p = Path('tests/reliability.spec.js')
s = p.read_text()
needle = "await page.getByRole('button', { name: /Hear it/i }).click();"
replacement = "const audioButton = page.getByRole('button', { name: /Hear it|Retry audio/i });\n  await expect(audioButton).toBeEnabled({ timeout: 5000 });\n  await audioButton.click();"
# Only the first two occurrences are stale empty/invalid prefetch tests.
for _ in range(2):
    if needle not in s:
        raise SystemExit('stale TTS test anchor not found')
    s = s.replace(needle, replacement, 1)
p.write_text(s)
