"use strict";
let listSize = 25;

window.addEventListener('DOMContentLoaded', async () => {
    const initalizingOptions = await browser.storage.local.get();
    loadOptions(initalizingOptions);
    await buildSessionList();
    browser.storage.onChanged.addListener(reloadOptions);
    browser.tabs.onRemoved.addListener(buildSessionList);
    browser.tabs.onCreated.addListener(buildSessionList);
    browser.tabs.onDetached.addListener(buildSessionList);
    browser.menus.onClicked.addListener(reOpenTab);
});


async function loadOptions(options) {
  if (Object.keys(options).length == 0) {
    //console.log("no options");
    createOptions();
  }
  else {
    listSize = parseInt(options.listSize);
    //console.log(options);
  }
}

async function reloadOptions(options) {
  listSize = parseInt(options.listSize.newValue);
  //console.log(options);
  buildSessionList();
}

async function createOptions() {
  browser.storage.local.set({
    listSize: listSize
  });
  //console.log("creating default options");
  let reloadingOptions = browser.storage.local.get();
  reloadingOptions.then(loadOptions);
}

function buildSessionList() {
  let gettingSessions = browser.sessions.getRecentlyClosed({maxResults: listSize});
  gettingSessions.then(updateClosedTabsMenu);
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
  await browser.menus.removeAll();
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
}

function reOpenTab(info, tab) {
  let gettingSessions = browser.sessions.getRecentlyClosed({maxResults: listSize});
  gettingSessions.then(restoreTab.bind(null,info.menuItemId));
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
