var colors = ["#E84A5F", "#FF847C", "#FECEA8", "#99B898", "#2F9395","#3d545e"];
var doneColor = "#494949";  

function DoObjects(todoString, todoTime, todoColor) {
  this.todoString = todoString;
  this.todoTime = todoTime;
  this.todoColor = todoColor || colors.slice(-1);
}

function init() {
  chrome.storage.sync.get(null, (getItems) => {
    if (!getItems["todos"] && !getItems["dones"]) initFirstRun();
  });
  
  renderDo(document.getElementById("todos"), "todos");
  renderDo(document.getElementById("dones"), "dones");
  chrome.tabs.executeScript( {
    code: "window.getSelection().toString();"
  }, function(selection) {
    document.getElementById("todoString").value = selection[0].substring(0, 25);
  });
  document.getElementById("dones").style.display = "none";

  switchView(true);

  chrome.browserAction.setBadgeBackgroundColor({"color": "#3d545e"});
  renderBadge();
}

function initFirstRun() {
  chrome.storage.sync.set({"todos": []}); 
  chrome.storage.sync.set({"dones": []});
  saveDo("buy new wine glasses", "todos", colors[0]);
  saveDo("redecorate living room", "todos", colors[1]);
  saveDo("pack for business trip", "todos", colors[2]);
  saveDo("add new TODO!", "todos", colors[5]);
  saveDo("download a todo app", "dones");
}

function saveDo(todoString, key, todoColor) {
  chrome.storage.sync.get(null, (getItems) => {
    if (getItems[key].length >= 10) {
      if (key === "todos") {
        renderMessage("error: max 10 dos.");
        return;
      } else {
        getItems[key].shift();
      }
    } 
    var doObject = new DoObjects(todoString, getTimestamp(), todoColor);
    if (key === "dones") doObject.todoColor = doneColor;
    var setItems = {};
    setItems[key] = getItems[key].concat(doObject);
    chrome.storage.sync.set(setItems);

    renderDo(document.getElementById(key), key);
    renderBadge();
  });

}

function deleteDo(todoTime, key) {
  chrome.storage.sync.get(null, (getItems) => {
    var setItems = {};
    getItems[key] = getItems[key].filter((getItem) => {return getItem.todoTime !== todoTime;});
    setItems[key] = getItems[key];
    chrome.storage.sync.set(setItems);
  });
}

function renderDo(element, key) {
  element.innerHTML = "";

  chrome.storage.sync.get(null, (getItems) => {
    getItems[key].forEach((getItem) => {
      var doElement = document.createElement("div");
      doElement.classList.add(key.slice(0, -1));
      doElement.style.backgroundColor = getItem.todoColor;

      var todoOptions = document.createElement("div");
      todoOptions.classList.add("todoOptions");

      var todoString = document.createElement("div");
      todoString.classList.add("todoString");
      todoString.innerHTML = getItem.todoString;
      var todoStringWidth = document.getElementsByClassName("todoStringWidth")[0];
      todoStringWidth.innerHTML = getItem.todoString;
      // todoString.innerHTML += todoStringWidth.clientWidth;
      if (todoStringWidth.clientWidth >= 500) todoString.style.fontSize = "40px";

	  var todoTime = document.createElement("span");
	  todoTime.classList.add("todoTime");
	  todoTime.innerHTML = (key.slice(0, -1) + ": " + getDateString(getItem.todoTime)).toUpperCase();

      var todoColors = [];
      colors.forEach((color) => {
        var todoColor = document.createElement("button");
        todoColor.classList.add("todoColor");

        todoColor.style.backgroundColor = color;
        todoColor.onclick = function() {
          doElement.style.backgroundColor = color;
          getItem.todoColor = color;
          chrome.storage.sync.set(getItems);
        }
        todoColors.push(todoColor);
      });

      var button = document.createElement("button");
      button.classList.add("confirm");
      button.innerHTML = "";

      var sep = document.createElement("span");
      sep.innerHTML = "&nbsp";
      
      todoColors.forEach((todoColor) => {
        todoOptions.appendChild(todoColor);
        todoColor.style.visibility = "visible";
        if (key === "dones") todoColor.style.visibility = "hidden";
      });

      if (key === "dones") todoOptions.appendChild(todoTime);

      todoOptions.appendChild(sep).appendChild(button);
      doElement.appendChild(todoString).appendChild(todoOptions);
      element.appendChild(doElement);

      button.onclick = (function() {
        deleteDo(getItem.todoTime, key);
        doElement.style.transform = "translate(190%)";
        setTimeout(function() {doElement.style.display = 'none';}, 300);
        if (key === "todos") {
          saveDo(getItem.todoString, "dones");
          renderMessage("TODO event moved to DONEs.");
        } else if (key === "dones") {
          renderMessage("DONE event deleted.");
        }
      });
    });
  });
}

function renderMessage(message) {
  document.getElementById("message").innerHTML = message;
  document.getElementById("message").style.opacity = 1;
  setTimeout(() => {document.getElementById("message").style.opacity = 0;}, 1000)
}

function renderBadge() {
  chrome.storage.sync.get(null, (getItems) => {
    var count = getItems.todos.length;
    chrome.browserAction.setBadgeText({"text": (count || "").toString()});
  });
}

function switchView(isInit) {
  var switchViewSpans = document.body.querySelectorAll("#switchView span");
  var elementsBackgroundColor = [document.getElementById("todoString"), document.getElementById("saveDo"), 
  document.getElementById("switchView"), document.getElementById("sync")];
  if (isInit || document.getElementById("todos").style.display === "none") {
    document.getElementById("todos").style.display = "block";
    document.getElementById("dones").style.display = "none";

    document.body.style.backgroundColor = "white"; 
    elementsBackgroundColor.forEach((element) => {element.style.backgroundColor = "#F0F0F0";});;

    switchViewSpans[0].style.color = switchViewSpans[1].style.color = "black";
    switchViewSpans[2].style.color = "#F0F0F0";

    document.getElementById("message").style.color = "black";
  } else {
    document.getElementById("todos").style.display = "none";
    document.getElementById("dones").style.display = "block";

    document.body.style.backgroundColor = "#1B1B1B";
    elementsBackgroundColor.forEach((element) => {element.style.backgroundColor = "black";});

    switchViewSpans[0].style.color = "black";
    switchViewSpans[1].style.color = switchViewSpans[2].style.color = "white";

    document.getElementById("message").style.color = "white";
  }
}

function getTimestamp() {
  return Date.now();
}

function getDateString(timestamp) {
  if (!timestamp) timestamp = Date.now();
  return new Date(parseInt(timestamp)).toLocaleString("en-US");
}

/*function getSepElement(num) {
  var sep = document.createElement("span");
  var repeated = "";
  for (var i = 0; i < num; i++) {
    repeated += "&nbsp";
  }
  sep.innerHTML = repeated;
  return sep;
}*/

document.addEventListener('DOMContentLoaded', () => {
  init();

  document.getElementById("saveDo").onclick = function() {
    var todoString = document.getElementById("todoString").value;
    if (todoString === "") {
      renderMessage("error: empty input.");
      return;
    }
    var key = "todos";
    saveDo(todoString, key);
    renderMessage("TODO event saved.");
    document.getElementById("todoString").value = "";
    document.getElementById("todoString").focus();
  };

  addEventListener("keydown", function(event) {
    if (event.keyCode == 13) document.getElementById("saveDo").click();
  });

  document.getElementById("switchView").onclick = function() {
    switchView();
  }

  document.getElementById("sync").onclick = function() {
    renderDo(document.getElementById("todos"), "todos");
    renderDo(document.getElementById("dones"), "dones");
  }

});










