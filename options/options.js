function loadOptions() {
  function setOptions(options) {
    //console.log(options);
    document.querySelector("#listSize").value = options.listSize;
  }
  var getting = browser.storage.local.get();
  getting.then(setOptions, onError);
}

function saveOptions(e) {
  e.preventDefault();
  browser.storage.local.set({
    listSize: document.querySelector("#listSize").value
  });
  loadOptions();
}

function onError(error) {
  console.log(`Error: ${error}`);
}

document.addEventListener("DOMContentLoaded", loadOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
