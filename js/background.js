"use strict";
const kTST_ID = 'treestyletab@piro.sakura.ne.jp';
let listSize = 25;
let middleClickEnabled = false;
let registrationStatus = false;

window.addEventListener('DOMContentLoaded', async () => {
    const initalizingOptions = await browser.storage.local.get();
    loadOptions(initalizingOptions);
    let registrationTimeout = 0;
    while (registrationStatus === false && registrationTimeout < 10000) {
        console.log("registering tst-closed_tabs_menu");
        await timeout(registrationTimeout);
        await registerToTST();
        registrationTimeout = registrationTimeout + 1000;
    }
    browser.storage.onChanged.addListener(reloadOptions);
    browser.tabs.onRemoved.addListener(buildSessionList);
    browser.tabs.onCreated.addListener(buildSessionList);
    browser.tabs.onDetached.addListener(buildSessionList);
    browser.runtime.onMessageExternal.addListener(onMessageExternal);
});

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function onMessageExternal(aMessage, aSender) {
    if (aSender.id === kTST_ID) {
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
  }
}

async function registerToTST() {
    try {
        const self = await browser.management.getSelf();
        let success = await browser.runtime.sendMessage(kTST_ID, {
            type: 'register-self',
            name: self.id,
            listeningTypes: ['fake-contextMenu-click', 'tabbar-clicked', 'ready'],
        });
        console.log("tst-closed_tabs_menu registration successful");
        registrationStatus = true;
        await buildSessionList();
        return true;
    }
    catch (ex) {
        console.log("tst-closed_tabs_menu registration failed with " + ex);
        return false;
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
  let reloadingOptions = browser.storage.local.get();
  reloadingOptions.then(loadOptions);
}

function buildSessionList() {
  let gettingSessions = browser.sessions.getRecentlyClosed({maxResults: listSize});
  gettingSessions.then(updateClosedTabsMenu);
}

async function emptyClosedTabsMenu() {
  await browser.runtime.sendMessage(kTST_ID, {
    type: 'fake-contextMenu-remove-all'
  });
  let id = 999;
  let type = 'normal';
  let title = 'Undo Closed Tabs';
  let parentId = null;
  let params = {id, type, title, contexts: ['tab']};
  await browser.runtime.sendMessage(kTST_ID, {
    type: 'fake-contextMenu-create',
    params
  });
}

async function updateClosedTabsMenu(sessions) {
  let tabs = [];
  sessions.forEach(function(session) {
    if (session.tab) {
      // This line below filters out things like about:newtab and basically anything but a webpage
      // Not sure if it's better with or without it...
      //if (session.tab.url.startsWith('http')) { tabs.push(session.tab); }
      tabs.push(session.tab);
    }
// Enable to include recently closed windows
// Firefox's own recently closed tabs menu doesn't include items like this, should we?
//    if (session.window) {
//      session.window.tabs.forEach(function(windowTab) {
//        if (windowTab.url.startsWith('http')) { tabs.push(windowTab); }
//      });
//    }
  });
  await emptyClosedTabsMenu();
  for (let iTab = 0; iTab < tabs.length; ++iTab) {
    let id = iTab;
    let type = 'normal';
    let title = tabs[iTab].title || 'No Title';
    let parentId = 999;
    let params = {id, type, title, parentId, contexts: ['tab']};
    await browser.runtime.sendMessage(kTST_ID, {
      type: 'fake-contextMenu-create',
      params
    });
  }
}

function reOpenTab(tabId) {
  let gettingSessions = browser.sessions.getRecentlyClosed({maxResults: listSize});
  gettingSessions.then(restoreTab.bind(null,tabId));
}

function reOpenLastTab() {
  let gettingSessions = browser.sessions.getRecentlyClosed({maxResults: listSize});
  gettingSessions.then(restoreTab.bind(null,0));
}

async function restoreTab(tabId,sessions) {
  let tabs = [];
  sessions.forEach(function(session) {
    if (session.tab) {
      //if (session.tab.url.startsWith('http')) { tabs.push(session.tab); }
      tabs.push(session.tab);
    }
// See earlier note about recently closed windows
//    if (session.window) {
//      session.window.tabs.forEach(function(windowTab) {
//        if (windowTab.url.startsWith('http')) { tabs.push(windowTab); }
//      });
//    }
  });
  browser.sessions.restore(tabs[tabId].sessionId);
}
