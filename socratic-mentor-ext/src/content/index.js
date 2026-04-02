console.log("%c SOCRATIC MENTOR LOADED ", "background: #222; color: #bada55; font-size: 20px;");

const observer = new MutationObserver(() => {
  const lines = document.querySelectorAll('.view-line');
  const code = Array.from(lines).map(line => line.innerText).join('\n');
  chrome.runtime.sendMessage({ type: 'CODE_UPDATED', code });
});

const startObserving = () => {
  const target = document.querySelector('.monaco-editor');
  if (target) {
    console.log("Found Monaco Editor! Starting observation...");
    observer.observe(target, { childList: true, subtree: true, characterData: true });
  } else {
    setTimeout(startObserving, 1000);
  }
};

startObserving();