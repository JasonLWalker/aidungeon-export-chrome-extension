var states = new Object();

function getPrompt(jsonObj) {
  let s = '';

  if (jsonObj['actionWindow']){
      let arryData = jsonObj.actionWindow;
      for (let i=arryData.length - 1; i>0;i--) {
          let o = arryData[i];
          if (o && o['type'] && o['text']) {
              s += o.text;
          }
      }
  }

  return s;
}

function getV1CardTemplate() {
  return {
      "name": "",
      "description": "",
      "personality": "",
      "scenario": "",
      "first_mes": "",
      "mes_example": ""
  };
}

function getV2CardTemplate() {
  return {
      spec: 'chara_card_v2',
      spec_version: '2.0', // May 8th addition
      data: Object.assign(getV1CardTemplate(), {
          // New fields start here
          creator_notes: '',
          system_prompt: '',
          post_history_instructions: '',
          alternate_greetings: [],
          //character_book: {},

          // May 8th additions
          tags: [],
          creator: '',
          character_version: '',
          extensions: {} // see details for explanation
      })
  };
}

function getCharacterBookEntryTemplate() {
  return {
      keys: [],
      content: '',
      extensions: {},
      enabled: false,
      insertion_order: 0, // if two entries inserted, lower "insertion order" = inserted higher
      //case_sensitive: //boolean?
  
      // FIELDS WITH NO CURRENT EQUIVALENT IN SILLY
      //name?: string // not used in prompt engineering
      //priority?: number // if token budget reached, lower priority value = discarded first
  
      // FIELDS WITH NO CURRENT EQUIVALENT IN AGNAI
      //id?: number // not used in prompt engineering
      //comment?: string // not used in prompt engineering
      //selective?: boolean // if `true`, require a key from both `keys` and `secondary_keys` to trigger the entry
      //secondary_keys?: Array<string> // see field `selective`. ignored if selective == false
      //constant?: boolean // if true, always inserted in the prompt (within budget limit)
      //position?: 'before_char' | 'after_char' // whether the entry is placed before or after the character defs
  };
}

function getCharacterBookTemplate() {
  return {
      //name: undefined
      //description: undefined
      //scan_depth: undefined // agnai: "Memory: Chat History Depth"
      //token_budget: undefined // agnai: "Memory: Context Limit"
      //recursive_scanning: undefined // no agnai equivalent. whether entry content can trigger other entries
      extensions: {},
      entries: []
  };
}

function buildCard(sourceObj) {
  if (!sourceObj)
    return null;

  console.log(sourceObj);
  let card = getV2CardTemplate();
  var data = card.data;

  data.name = sourceObj['title'].replaceAll(/[^\w \-]/gi,'_');
  data.creator_notes = sourceObj['description'];
  data.scenario = sourceObj['modelContext'];
  data.description = sourceObj['authorsNote'];
  data.first_mes = getPrompt(sourceObj);
  data.personality = sourceObj['memory'];

  data.avatar = sourceObj['image'] + '/thumb';

  const tags = sourceObj['tags'] || [];
  for (let i=0;i<tags.length;i++) {
    data.tags.push(tags[i]);
  }

  const lore = sourceObj['storyCards'] || [];
  if (lore) {
    data.character_book = getCharacterBookTemplate();
    for (let i=0;i<lore.length;i++) {
      var origEntry = lore[i];
      var newEntry = getCharacterBookEntryTemplate();
      newEntry.id = origEntry['id'];
      newEntry.name = origEntry['title'];
      newEntry.comment = newEntry.name;
      newEntry.content = origEntry['value'];
      newEntry.secondaryKeys = [origEntry['type']];
      newEntry.enabled = true;
      const keys = (origEntry['keys'] || "").split(',');
      for (let i=0;i<keys.length;i++) {
        newEntry.keys.push(keys[i].trim());
      }
      data.character_book.entries.push(newEntry);
    }  
  }

  return card;

}

function toggleIcons(isActive) {
  if (isActive) {
    chrome.action.setIcon({
      path: {
        "16": "/images/icon-16-active.png",
        "32": "/images/icon-32-active.png",
        "48": "/images/icon-48-active.png",
        "128": "/images/icon-128-active.png"
      }
    });
  } else {
    chrome.action.setIcon({
      path: {
        "16": "/images/icon-16.png",
        "32": "/images/icon-32.png",
        "48": "/images/icon-48.png",
        "128": "/images/icon-128.png"
      }
    });  
  }
}

chrome.runtime.onInstalled.addListener(() => {
  toggleIcons(false);
});

chrome.tabs.onActivated.addListener(
  function(activeInfo) {
    //console.log(activeInfo.tabId);
    toggleIcons(states[activeInfo.tabId]);
  }
);

chrome.tabs.onUpdated.addListener(
  function(tabId, changeInfo, tab) {
    states[tabId] = null;
    toggleIcons(states[tabId]);
  }
);

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === "gglChromeExtensionExport_cardready") {
      sendResponse({});
      states[sender.tab.id] = buildCard(request['data']);
      toggleIcons(states[sender.tab.id]);
    }


  }
);

chrome.action.onClicked.addListener(async (tab) => {
  if (states[tab.id]) {
    chrome.tabs.sendMessage(tab.id, {action: "gglChromeExtensionExport_ondownload", data: states[tab.id]});
  }  
});


