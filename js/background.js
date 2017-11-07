"use strict";
const kTST_ID = 'treestyletab@piro.sakura.ne.jp';
const ext_ID = 'tst-closed_tabs_menu@dontpokebadgers.com';
var listSize = 16;
var middleClickEnabled = false;

async function registerToTST() {
  var success = await browser.runtime.sendMessage(kTST_ID, {
    type: 'register-self',
    name: ext_ID,
    //style: '.tab {color: blue;}'
  });
  if (success) {
    //console.log(ext_ID + " successfully registered");
    clearTimeout(registrationTimer);
    await buildSessionList();
  }
}

async function loadOptions(options) {
  if (Object.keys(options).length == 0) {
    //console.log("no options");
    createOptions();
  }
  else {
    listSize = parseInt(options.listSize);
    middleClickEnabled = options.middleClickEnabled;
    //console.log(options);
  }
}

async function reloadOptions(options) {
  listSize = parseInt(options.listSize.newValue);
  middleClickEnabled = options.middleClickEnabled.newValue;
  //console.log(options);
  buildSessionList();
}

async function createOptions() {
  browser.storage.local.set({
    listSize: listSize,
    middleClickEnabled: middleClickEnabled
  });
  //console.log("creating default options");
  var reloadingOptions = browser.storage.local.get();
  reloadingOptions.then(loadOptions);
}

function buildSessionList() {
  var gettingSessions = browser.sessions.getRecentlyClosed({maxResults: listSize});
  gettingSessions.then(updateClosedTabsMenu);
}

async function emptyClosedTabsMenu() {
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
}

async function updateClosedTabsMenu(sessions) {
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
  await emptyClosedTabsMenu();
  for (var iTab = 0; iTab < tabs.length; ++iTab) {
    var id = iTab;
    var type = 'normal';
    var title = tabs[iTab].title || 'No Title';
    var parentId = 999;
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

function reOpenLastTab() {
  var gettingSessions = browser.sessions.getRecentlyClosed({maxResults: 8});
  gettingSessions.then(restoreTab.bind(null,0));
}

async function restoreTab(tabId,sessions) {
  var tabs = [];
  sessions.forEach(function(session) {
    if (session.tab) {
      if (session.tab.url.startsWith('http')) { tabs.push(session.tab); }
    }
//    if (session.window) {
//      session.window.tabs.forEach(function(windowTab) {
//        if (windowTab.url.startsWith('http')) { tabs.push(windowTab); }
//      });
//    }
  });
  browser.sessions.restore(tabs[tabId].sessionId);
}

var registrationTimer = setInterval(registerToTST, 2000);
var initalizingOptions = browser.storage.local.get();
initalizingOptions.then(loadOptions);
browser.storage.onChanged.addListener(reloadOptions);
browser.sessions.onChanged.addListener(buildSessionList);
browser.runtime.onMessageExternal.addListener((aMessage, aSender) => {
  switch (aSender.id) {
    case kTST_ID:
      //console.log(aMessage.type)
      switch (aMessage.type) {
        case 'ready':
          //console.log("re-registering");
          registerToTST();
          break;
        case 'tabbar-clicked':
          if (aMessage.button == 1 && middleClickEnabled) {
            //console.log("middle click in tabbar");
            reOpenLastTab();
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
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
