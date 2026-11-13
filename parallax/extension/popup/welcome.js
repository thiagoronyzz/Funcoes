document.getElementById("try").addEventListener("click", () => {
  const target = "https://pt.wikipedia.org/wiki/Aten%C3%A7%C3%A3o";
  chrome.tabs.create({ url: target }).catch(() => {});
});

document.getElementById("close").addEventListener("click", () => {
  window.close();
});
