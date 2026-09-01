// Isolated Gemini API contract guard for Bolna.
// Inline audio is sent through v1beta and an audio-capable model.
(() => {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url;
    if (url !== 'https://generativelanguage.googleapis.com/v1/interactions') {
      return nativeFetch(input, init);
    }

    const correctedUrl = 'https://generativelanguage.googleapis.com/v1beta/interactions';
    let correctedInit = init;

    if (typeof init?.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        const hasInlineAudio = Array.isArray(body?.input) && body.input.some(x => x?.type === 'audio');
        if (hasInlineAudio) {
          body.model = 'gemini-3.7-flash';
          correctedInit = { ...init, body: JSON.stringify(body) };
        }
      } catch {}
    }

    if (typeof input === 'string') return nativeFetch(correctedUrl, correctedInit);
    return nativeFetch(new Request(correctedUrl, input), correctedInit);
  };
  window.__bolnaApiContractFix = 'v1beta-audio-model-guard';
})();
