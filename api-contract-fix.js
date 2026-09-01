// Isolated Gemini API contract guard for Bolna.
// Inline audio uses the documented Interactions audio contract:
// v1beta + gemini-3.7-flash + low thinking for latency.
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
          body.generation_config = { ...(body.generation_config || {}), thinking_level: 'low' };
          correctedInit = { ...init, body: JSON.stringify(body) };
        }
      } catch {}
    }

    if (typeof input === 'string') return nativeFetch(correctedUrl, correctedInit);
    return nativeFetch(new Request(correctedUrl, input), correctedInit);
  };
  window.__bolnaApiContractFix = 'v1beta-audio-model-thinking-guard';
})();
