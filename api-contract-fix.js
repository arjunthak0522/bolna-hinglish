// Temporary isolated API-contract correction for QA.
// Google’s current inline-audio Interactions examples use v1beta.
(() => {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input?.url;
    if (url === 'https://generativelanguage.googleapis.com/v1/interactions') {
      const corrected = 'https://generativelanguage.googleapis.com/v1beta/interactions';
      if (typeof input === 'string') return nativeFetch(corrected, init);
      return nativeFetch(new Request(corrected, input), init);
    }
    return nativeFetch(input, init);
  };
  window.__bolnaApiContractFix = 'v1beta-inline-audio';
})();
