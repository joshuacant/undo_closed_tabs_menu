"use strict";

async function _init() {
  const self = await browser.management.getSelf();
  console.log(self.id + " loading");

  await loadOptions(self);
  await buildSessionList();

  browser.storage.onChanged.addListener(reloadOptions);
  browser.menus.onShown.addListener(buildSessionList);
  browser.menus.onClicked.addListener(reOpenTab);
}

let listSize = 25;
async function loadOptions(self) {
  let options = await browser.storage.local.get();
  if (Object.keys(options).length == 0) {
    createOptions(self);
  }
  else {
    listSize = parseInt(options.listSize);
  }
}

async function reloadOptions(options) {
  listSize = parseInt(options.listSize.newValue);
}

async function createOptions(self) {
  console.log(self.id + " creating options");
  await browser.storage.local.set({
    listSize: listSize
  });
  let reloadingOptions = browser.storage.local.get();
  reloadingOptions.then(loadOptions);
}

async function buildSessionList() {
  let gettingSessions = browser.sessions.getRecentlyClosed({ maxResults: listSize });
  gettingSessions.then(updateClosedTabsMenu);
}

async function updateClosedTabsMenu(sessions) {
  let tabs = [];
  sessions.forEach(function (session) {
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
  await browser.menus.removeAll();
  await browser.menus.refresh();
  for (let iTab = 0; iTab < tabs.length; ++iTab) {
    let id = iTab.toString();
    let type = 'normal';
    let title = tabs[iTab].title || 'No Title';
    await browser.menus.create({
      id: id,
      type: type,
      title: title,
      contexts: ['tab']
    });
  }
  await browser.menus.refresh();
}

function reOpenTab(info, tab) {
  let gettingSessions = browser.sessions.getRecentlyClosed({ maxResults: listSize });
  gettingSessions.then(restoreTab.bind(null, info.menuItemId));
}

async function restoreTab(tabId, sessions) {
  let tabs = [];
  sessions.forEach(function (session) {
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

_init();
