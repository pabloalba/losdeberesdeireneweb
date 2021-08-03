let pageId;
let imageWidth;
let imageHeight;
let currentFontName;

let viewPortWidth;
let viewPortHeight;

let viewBoxWidth;
let viewBoxHeight;

let scrollOffset;

let viewPortElement;
let svgElement;
let labelsElement;
let labelInputElement;
let currentLabel = null;


let labelInputId;
let labelInputX;
let labelInputY;

let currentFontSize;
let currentColor;

let cursor;
let labelBg;

const LABEL_ID_PREFIX = "label-";
const NEW_LABEL_ID = "label-new";


// ====== Initialization ==================

export function setupPage(id, width, height, fontName) {
  pageId = id;
  imageWidth = width;
  imageHeight = height;
  currentFontName = fontName;
  scrollOffset = 0;

  // Wait for the document to be fully loaded, and then finish
  // the setup (or do it immediately if the document is already
  // loaded when calling this).
  if (document.readyState != "loading") {
    pageLoaded();
  } else {
    document.addEventListener("DOMContentLoaded", pageLoaded);
  }
}


function pageLoaded() {
  viewPortElement = document.getElementById("page-viewport");
  svgElement = viewPortElement.querySelector("#page-viewport svg");
  labelsElement = document.getElementById("labels");
  labelInputElement = document.getElementById("label-input");

  window.addEventListener("resize", onResize);
  svgElement.addEventListener("wheel", onWheel);
  svgElement.addEventListener("click", onClick);

  document.getElementById("go-back-button").addEventListener("click", goBack);

  labelInputElement.addEventListener("keyup", onChange);

  for (let sizeButton of document.querySelectorAll(".size-button")) {
    sizeButton.addEventListener("click", changeSize);
  }

  currentFontSize = "medium";
  setSelectedButton(".size-button", "data-font-size", "medium");

  for (let colorButton of document.querySelectorAll(".color-button")) {
    colorButton.addEventListener("click", changeColor);
  }

  currentColor = "blue";
  setSelectedButton(".color-button", "data-color", "blue");

  for (let labelElement of document.querySelectorAll(".page-label")) {
    labelElement.addEventListener("click", onClickLabel);
  }

  cursor = document.getElementById("cursor");
  labelBg = document.getElementById("label-bg");

  window.setInterval(function(){
    if (cursor.style.opacity == 0.25){
        cursor.style.opacity = 1;
    } else {
        cursor.style.opacity = 0.25;
    }
    }, 500);

  document.addEventListener('keydown', onKeyDown)

  // The resize event does not occur in the initial load,
  // so we call it once here.
  onResize();
}


// ====== Events ==================

function onResize() {
  // On window resize, set the viewport size to ocuppy all the available
  // space, and zoom the image to fit the viewport width.
  viewPortWidth = viewPortElement.offsetWidth;
  viewPortHeight = viewPortElement.offsetHeight;

  const ratio = viewPortHeight / viewPortWidth;

  viewBoxWidth = imageWidth;
  viewBoxHeight = imageWidth * ratio;

  for (let labelElement of document.querySelectorAll(".page-label")) {
    const labelFontSize = labelElement.getAttribute("data-font-size");
    labelElement.setAttribute("style", "font-size: " + getFontSize(labelFontSize));
  }

  setViewBox();
}


function onWheel(event) {
  event.preventDefault();

  if (viewPortElement) {
    scroll(event.deltaY)
  }
}

function scroll(delta){
    scrollOffset += delta;
    scrollOffset = Math.min(scrollOffset, (imageHeight - viewBoxHeight));
    scrollOffset = Math.max(scrollOffset, 0);
    setViewBox();
}

function changeSize(event) {
  // target could also be the inner img, but 'this' is always the element with the handler
  const buttonElement = this;
  currentFontSize = buttonElement.getAttribute("data-font-size");
  setSelectedButton(".size-button", "data-font-size", currentFontSize);
}


function changeColor(event) {
  const buttonElement = this;
  currentColor = buttonElement.getAttribute("data-color");
  setSelectedButton(".color-button", "data-color", currentColor);
}


function onClick(event) {
  event.preventDefault();

  if (viewPortElement) {
    const label = createLabel(Math.round(screenToImage(event.offsetX)), Math.round(screenToImage(event.offsetY) + scrollOffset), "");
    selectLabel(label);
  }
}


function onClickLabel(event) {
  event.preventDefault();
  event.stopPropagation();

  if (viewPortElement) {
    selectLabel(event.target);
  }
}

function selectLabel(label){
    if (currentLabel != null) {
        sendCreateOrUpdateLabel(currentLabel);
    }
    currentLabel = label;
    updateCursor();
    labelInputElement.value = currentLabel.textContent;
    labelInputElement.focus();
}

 function updateCursor(){
    if (currentLabel != null){
        const fontSize = getFontSize(currentLabel.getAttribute("data-font-size"));
        const x = Number(currentLabel.getAttribute("x")) + currentLabel.getBBox().width;
        cursor.setAttribute("x", x);
        cursor.setAttribute("y", (currentLabel.getAttribute("y") - fontSize + 10));
        cursor.setAttribute("width", fontSize/2);
        cursor.setAttribute("height", fontSize);
        cursor.setAttribute("fill", currentColor);

        labelBg.setAttribute("x", currentLabel.getAttribute("x"));
        labelBg.setAttribute("y", currentLabel.getAttribute("y") - fontSize);
        labelBg.setAttribute("width", currentLabel.getBBox().width);
        labelBg.setAttribute("height", fontSize + 10);
    }

}

function onChange(event) {
  if (viewPortElement) {
    const text = labelInputElement.value;
    if (currentLabel != null){
        currentLabel.textContent = text;
        updateCursor();
    }
  }
}


function onKeyDown(e){
    if (40 == e.which){
        scroll(100);
        e.preventDefault();
    } else if (38 == e.which){
        scroll(-100);
        e.preventDefault();
    } else if (38 == e.which){
        scroll(-100);
        e.preventDefault();
    } else if (37 == e.which || 39 == e.which){
        e.preventDefault();
    }
}

function nextLabel(){
    if (currentLabel != null){
        var next = 0;
        for (var i =0; i<labelsElement.childNodes.length; i++){
            if (labelsElement.childNodes[i] == currentLabel){
                if (i < labelsElement.childNodes.length -1){
                    next = i+1;
                }
                break;
            }
        }
        selectLabel(labelsElement.childNodes[next]);
    }
}

function goBack(url){
    if (currentLabel != null) {
        sendCreateOrUpdateLabel(currentLabel, function(){
            document.location = document.getElementById("go-back-button").getAttribute("data-url")
        });
    }
}

// ====== Auxiliary functions ==================

function setViewBox() {
  svgElement.setAttribute("width", viewPortWidth);
  svgElement.setAttribute("height", viewPortHeight);
  svgElement.setAttribute("viewBox",
    "0 " + scrollOffset.toString() + " " +
    viewBoxWidth.toString() + " " + 
    viewBoxHeight.toString());
}


function setSelectedButton(query, attribute, value) {
  for (let button of document.querySelectorAll(query)) {
    if (button.getAttribute(attribute) === value) {
      button.classList.add("selected");
    } else {
      button.classList.remove("selected");
    }
  }
}


function createLabel(x, y, text) {
  const labelElement = document.createElementNS("http://www.w3.org/2000/svg", "text");

  labelElement.setAttribute("id", NEW_LABEL_ID);
  labelElement.setAttribute("class", "page-label");
  labelElement.setAttribute("x", x);
  labelElement.setAttribute("y", y);
  labelElement.setAttribute("data-font-name", currentFontName);
  labelElement.setAttribute("data-font-size", currentFontSize);
  labelElement.setAttribute("data-color", currentColor);
  labelElement.setAttribute("style", "font-size: " + getFontSize(currentFontSize));
  labelElement.textContent = text;

  labelElement.addEventListener("click", onClickLabel);

  labelsElement.appendChild(labelElement);
  return labelElement;
}


function screenToImage(pos) {
  return pos * viewBoxWidth / viewPortWidth;
}


function imageToScreen(pos) {
  return pos * viewPortWidth / viewBoxWidth;
}


function getFontSize(fontSize) {
  if (fontSize === "small") {
    return viewBoxWidth / 50;
  }
  if (fontSize === "medium") {
    return viewBoxWidth / 25;
  }
  if (fontSize === "big") {
    return viewBoxWidth / 15;
  }
  return 1;
}


// ====== HTTP API functions ==================

function sendCreateLabel(label, callback) {
  let text = label.textContent;
  if (text != ""){
      let xhr = new XMLHttpRequest();
      xhr.open("POST", "/pages/" + pageId.toString() + "/labels");
      xhr.setRequestHeader("Content-Type", "application/json");

      xhr.onload = function() {
        if (xhr.status != 200) {
          console.error("ERROR on save: ", xhr.statusText);
        } else {
          const label = JSON.parse(xhr.response)[0];
          const labelElement = document.getElementById("label-" + NEW_LABEL_ID);
          if (labelElement) {
            labelElement.setAttribute("id", LABEL_ID_PREFIX + label.pk.toString());
          }
          if (callback){
            callback();
          }
        }
      };

      xhr.send(JSON.stringify({
        "x": label.getAttribute("x"),
        "y": label.getAttribute("y"),
        "text": label.textContent,
        "font_name": label.getAttribute("data-font-name"),
        "font_size": label.getAttribute("data-font-size"),
        "color": label.getAttribute("data-color")
      }));
  }
}


function sendUpdateLabel(label, callback) {
  const labelId = label.id.slice(LABEL_ID_PREFIX.length);

  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/pages/" + pageId.toString() + "/labels/" + labelId);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = function() {
    if (xhr.status != 200) {
      console.error("ERROR on save: ", xhr.statusText);
    } else {
      if (callback){
        callback();
      }
    }
  };

  xhr.send(JSON.stringify({
    "text": label.textContent
  }));
}

function sendCreateOrUpdateLabel(label, callback){
    if (NEW_LABEL_ID == label.id){
        sendCreateLabel(label, callback)
    } else {
        sendUpdateLabel(label, callback)
    }
}
