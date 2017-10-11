const kTST_ID = 'treestyletab@piro.sakura.ne.jp';
const ext_ID = 'tst-closed_tabs_menu@dontpokebadgers.com'
var listSize = null;

function initialRegisterToTST() {
  setTimeout(registerToTST, 3000);
}

async function registerToTST() {
  var success = await browser.runtime.sendMessage(kTST_ID, {
    type: 'register-self',
    name: ext_ID,
    //style: '.tab {color: blue;}'
  })
//  if (!success) {
//    console.log(ext_ID+" unable to register.");
//    }
//  else {
//    console.log(ext_ID+" registered sucessfully.");
//  }
}

async function loadOptions(options) {
  if (Object.keys(options).length == 0) {
    //console.log("no options");
    createOptions();
  }
  else {
    listSize = options.listSize;
    //console.log(options);
  }
}

async function createOptions() {
  browser.storage.local.set({
    listSize: "16"
  });
  //console.log("creating default options");
  var reloadingOptions = browser.storage.local.get();
  reloadingOptions.then(loadOptions);
}

function tabClosed() {
  var initalizingOptions = browser.storage.local.get();
  initalizingOptions.then(loadOptions);
  var gettingSessions = browser.sessions.getRecentlyClosed({maxResults: listSize});
  gettingSessions.then(updateClosedTabsList);
}

async function updateClosedTabsList(sessions) {
  var tabs = [];
  sessions.forEach(function(session) {
    if (session.tab) {
      if (session.tab.url.startsWith('http')) { tabs.push(session.tab); }
    }
    if (session.window) {
      session.window.tabs.forEach(function(windowTab) {
        if (windowTab.url.startsWith('http')) { tabs.push(windowTab); }
      });
    }
  });
  //console.log(tabs);
  await browser.runtime.sendMessage(kTST_ID, {
    type: 'fake-contextMenu-remove-all'
  });
  var id = 999;
  var type = 'normal';
  var title = 'Undo Closed Tabs';
  var parentId = null;
  let params = {id, type, title, contexts: ['tab']};
  await browser.runtime.sendMessage(kTST_ID, {
    type: 'fake-contextMenu-create',
    params
  });
  for (var iTab = 0; iTab < tabs.length; ++iTab) {
    id = iTab;
    type = 'normal';
    title = tabs[iTab].title || 'No Title';
    parentId = 999;
    let params = {id, type, title, parentId, contexts: ['tab']};
    await browser.runtime.sendMessage(kTST_ID, {
      type: 'fake-contextMenu-create',
      params
    });
  }
}

function reOpenTab(tabId) {
  var gettingSessions = browser.sessions.getRecentlyClosed({maxResults: listSize});
  gettingSessions.then(restoreTab.bind(null,tabId));
}

async function restoreTab(tabId,session) {
  var tabs = [];
  session.forEach(function(session) {
    if (session.tab) {
      if (session.tab.url.startsWith('http')) { tabs.push(session.tab); }
    }
    if (session.window) {
      session.window.tabs.forEach(function(windowTab) {
        if (windowTab.url.startsWith('http')) { tabs.push(windowTab); }
      });
    }
  });
  //var restoringSession = 
  browser.sessions.restore(tabs[tabId].sessionId);
  //restoringSession.then;
}

initialRegisterToTST();
browser.sessions.onChanged.addListener(tabClosed);
browser.runtime.onMessageExternal.addListener((aMessage, aSender) => {
//  var refreshingOptions = browser.storage.local.get();
//  refreshingOptions.then(loadOptions);
  switch (aSender.id) {
    case kTST_ID:
      //console.log(aMessage.type)
      switch (aMessage.type) {
        case 'ready':
          //console.log("re-registering");
          registerToTST();
          break;
        case 'fake-contextMenu-click':
          //console.log("menu item clicked " + aMessage.info.menuItemId);
          reOpenTab(aMessage.info.menuItemId);
          break;
      }
      break;
  }
});

//var success = await browser.runtime.sendMessage(kTST_ID, {
//  type: 'unregister-self'
//});
