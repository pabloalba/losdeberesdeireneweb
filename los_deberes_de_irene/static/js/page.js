let pageId;
let imageWidth;
let imageHeight;

let viewPortWidth;
let viewPortHeight;

let viewBoxWidth;
let viewBoxHeight;

let scrollOffset;

let viewPortElement;
let svgElement;
let labelsElement;
let labelInputElement;

let labelInputId;
let labelInputX;
let labelInputY;

let currentFontSize;
let currentColor;

const LABEL_ID_PREFIX = "label-";
const NEW_LABEL_ID = "label-new";


// ====== Initialization ==================

export function setupPage(id, width, height) {
  pageId = id;
  imageWidth = width;
  imageHeight = height;
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

  labelInputElement.addEventListener("blur", onBlur);

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
    console.log(labelFontSize);
    console.log(getFontSize(labelFontSize));
    labelElement.setAttribute("style", "font-size: " + getFontSize(labelFontSize));
  }

  setViewBox();
}


function onWheel(event) {
  event.preventDefault();

  if (viewPortElement) {
    scrollOffset += event.deltaY;
    scrollOffset = Math.min(scrollOffset, (imageHeight - viewBoxHeight));
    scrollOffset = Math.max(scrollOffset, 0);
    setViewBox();
  }
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
    labelInputId = NEW_LABEL_ID;
    labelInputX = event.offsetX;
    labelInputY = event.offsetY;
    showLabelInput(currentFontSize, "");
  }
}


function onClickLabel(event) {
  event.preventDefault();
  event.stopPropagation();

  if (viewPortElement) {
    const labelElement = event.target;
    labelInputId = labelElement.getAttribute("id");
    labelInputX = imageToScreen(labelElement.getAttribute("x"));
    labelInputY = imageToScreen(labelElement.getAttribute("y") - scrollOffset);
    labelElement.style.opacity = 0;
    showLabelInput(labelElement.getAttribute("data-font-size"), labelElement.textContent.trim());
  }
}


function onBlur(event) {
  if (viewPortElement) {
    const x = screenToImage(labelInputX);
    const y = screenToImage(labelInputY) + scrollOffset;
    const text = labelInputElement.value.trim();
    hideLabelInput();

    if (labelInputId === NEW_LABEL_ID) {
      if (text.length > 0) {
        createLabel(x, y, text);
        sendCreateLabel(x, y, text);
      }
    } else {
      updateLabel(text);
      sendUpdateLabel(text);
    }
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


function showLabelInput(fontSize, text) {
  const screenFontSize = imageToScreen(getFontSize(fontSize));

  labelInputElement.style.left = labelInputX;
  labelInputElement.style.top = labelInputY - screenFontSize * 0.75;
  labelInputElement.style.width = viewPortWidth - labelInputX;
  labelInputElement.style.fontSize = screenFontSize.toString() + "px";
  labelInputElement.setAttribute("data-color", currentColor);
  labelInputElement.value = text;
  labelInputElement.focus();
}


function hideLabelInput() {
  labelInputElement.style.left = -1000;
  labelInputElement.style.top = -1000;
  labelInputElement.value = "";
}


function createLabel(x, y, text) {
  const labelElement = document.createElementNS("http://www.w3.org/2000/svg", "text");

  labelElement.setAttribute("id", NEW_LABEL_ID);
  labelElement.setAttribute("class", "page-label");
  labelElement.setAttribute("x", x);
  labelElement.setAttribute("y", y);
  labelElement.setAttribute("data-font-size", currentFontSize);
  labelElement.setAttribute("data-color", currentColor);
  labelElement.setAttribute("style", "font-size: " + getFontSize(currentFontSize));
  labelElement.textContent = text;

  labelElement.addEventListener("click", onClickLabel);

  labelsElement.appendChild(labelElement);
}


function updateLabel(text) {
  const labelElement = document.getElementById(labelInputId);
  if (text.length > 0) {
    labelElement.textContent = text;
    labelElement.style.opacity = 1;
  } else {
    labelElement.parentNode.removeChild(labelElement);
  }
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

function sendCreateLabel(x, y, text) {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/pages/" + pageId.toString() + "/labels");
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = function() {
    if (xhr.status != 200) {
      console.error("ERROR on save: ", xhr.statusText);
    } else {
      const label = JSON.parse(xhr.response)[0];
      const labelElement = document.querySelector(".page-label#" + NEW_LABEL_ID);
      if (labelElement) {
        labelElement.setAttribute("id", LABEL_ID_PREFIX + label.pk.toString());
      }
    }
  };

  xhr.send(JSON.stringify({
    "x": x,
    "y": y,
    "text": text,
    "font_name": "xxx",
    "font_size": currentFontSize,
    "color": currentColor,
  }));
}


function sendUpdateLabel(text) {
  const labelId = labelInputId.slice(LABEL_ID_PREFIX.length);

  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/pages/" + pageId.toString() + "/labels/" + labelId);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = function() {
    if (xhr.status != 200) {
      console.error("ERROR on save: ", xhr.statusText);
    }
  };

  xhr.send(JSON.stringify({
    "text": text,
  }));
}

