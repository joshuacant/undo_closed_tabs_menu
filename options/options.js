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
  var listSizeValue = document.querySelector("#listSize").value;
  if (listSizeValue > 25) { listSizeValue = 25;}
  browser.storage.local.set({
    listSize: listSizeValue
  });
  loadOptions();
}

function onError(error) {
  console.log(`Error: ${error}`);
}

document.addEventListener("DOMContentLoaded", loadOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
