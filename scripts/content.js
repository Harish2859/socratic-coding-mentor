// Function to grab code from Monaco Editor (LeetCode/CodeChef)
function getCode() {
    // LeetCode stores lines in 'view-line' classes
    const lines = document.querySelectorAll('.view-line');
    let fullCode = "";
    lines.forEach(line => {
        fullCode += line.innerText + "\n";
    });
    return fullCode;
}

// Observe changes in the editor
const observer = new MutationObserver(() => {
    const code = getCode();
    // Send code to the Side Panel/Popup
    chrome.runtime.sendMessage({ type: "CODE_UPDATE", data: code });
});

// Start observing the editor container
const editorTarget = document.querySelector('.monaco-editor');
if (editorTarget) {
    observer.observe(editorTarget, { childList: true, subtree: true });
}