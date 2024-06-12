
function log(...args) {
  console.log("[AI Dungeon Exporter]", ...args);
}

// Inject Intercept script for fetch
var s = document.createElement('script');
s.src = chrome.runtime.getURL('scripts/fetchIntercept.js');
s.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(s); 


// Add listener for window communication
window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
      return;

  if (event.data.action && (event.data.action == "gglChromeExtensionExport_cardready")) {
      console.log("Content script received message: " + event.data.action);
      chrome.runtime.sendMessage(event.data);
  }
});

// Add listener for 2-way extension communication
chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {
    try {
      // Listen for download event
      if (request.action === "gglChromeExtensionExport_ondownload") {
        // Respond to extension
        sendResponse({});

        console.log(request['data']);
        const card = request['data'];
        const str = Array.from(new TextEncoder('utf-8').encode(JSON.stringify(card)), (byte) =>
          String.fromCodePoint(byte),
        ).join("");
        var elemLink = document.createElement('a');
        elemLink.id = 'gglChromeExtensionAidsExport';
        elemLink.innerText = 'Test';
        elemLink.style.cssText = 'display:none;';
        elemLink.href = "data:application/json;base64," + btoa(str);
        elemLink.download=(card.data['name'] || '')+".json";
        window.document.body.appendChild(elemLink);
        console.log(elemLink);
        await elemLink.click();
        elemLink.remove();
        
        // Retrieve link element
        //let elem = document.querySelector('#gglChromeExtensionAidsExport');
        // Trigger download
        //if (elem)
        //  elem.click();
      }
    } catch (ex) {
      log("An exception has occurred", ex);
    }
  }
);
