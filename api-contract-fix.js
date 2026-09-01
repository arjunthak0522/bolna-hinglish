// Isolated Gemini API contract guard for Bolna.
// Only inline-audio requests are rewritten to the documented audio contract.
(() => {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url;
    if (url !== 'https://generativelanguage.googleapis.com/v1/interactions') {
      return nativeFetch(input, init);
    }

    if (typeof init?.body !== 'string') {
      return nativeFetch(input, init);
    }

    try {
      const body = JSON.parse(init.body);
      const hasInlineAudio = Array.isArray(body?.input) && body.input.some(x => x?.type === 'audio');

      // Text/Hinglish/TTS requests stay on their original v1 endpoint.
      if (!hasInlineAudio) {
        return nativeFetch(input, init);
      }

      // Microphone transcription uses the audio-capable Interactions contract.
      body.model = 'gemini-3.7-flash';
      body.generation_config = { ...(body.generation_config || {}), thinking_level: 'low' };
      const correctedInit = { ...init, body: JSON.stringify(body) };
      const correctedUrl = 'https://generativelanguage.googleapis.com/v1beta/interactions';

      if (typeof input === 'string') return nativeFetch(correctedUrl, correctedInit);
      return nativeFetch(new Request(correctedUrl, input), correctedInit);
    } catch {
      return nativeFetch(input, init);
    }
  };
  window.__bolnaApiContractFix = 'audio-only-v1beta-guard';
})();
