let imageWidth = 0;
let imageHeight = 0;

let viewPortWidth = 0;
let viewPortHeight = 0;

let viewBoxWidth = 0;
let viewBoxHeight = 0;

let scrollOffset = 0;

let viewPortElement;
let svgElement;
let labelsElement;
let labelInputElement;

let labelInputX;
let labelInputY;


// ====== Initialization ==================

export function setupPage(width, height) {
  imageWidth = width;
  imageHeight = height;

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
  svgElement = viewPortElement.querySelectorAll("svg")[0];
  labelsElement = document.getElementById("labels");
  labelInputElement = document.getElementById("label-input");

  window.addEventListener("resize", onResize);
  svgElement.addEventListener("wheel", onWheel);
  svgElement.addEventListener("click", onClick);

  labelInputElement.addEventListener("blur", onBlur);

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


function onClick(event) {
  event.preventDefault();

  if (viewPortElement) {
    labelInputX = event.offsetX;
    labelInputY = event.offsetY;
    showLabelInput();
  }
}


function onBlur(event) {
  if (viewPortElement) {
    const x = screenToImage(labelInputX);
    const y = screenToImage(labelInputY) + scrollOffset;
    const text = labelInputElement.value;
    hideLabelInput();
    createLabel(x, y, text);
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


function showLabelInput() {
  labelInputElement.style.left = labelInputX;
  labelInputElement.style.top = labelInputY - 37;
  labelInputElement.style.fontSize = imageToScreen(15).toString() + "px";
  labelInputElement.focus();
}


function hideLabelInput() {
  labelInputElement.style.left = -1000;
  labelInputElement.style.top = -1000;
  labelInputElement.value = "";
}


function createLabel(x, y, text) {
  const labelElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
  labelElement.setAttribute("class", "page-label");
  labelElement.setAttribute("x", x);
  labelElement.setAttribute("y", y);
  labelElement.setAttribute("style", "fill: #54C6EB; font-size: 15");
  labelElement.textContent = text;

  labelsElement.appendChild(labelElement);
}


function screenToImage(pos) {
  return pos * viewBoxWidth / viewPortWidth;
}


function imageToScreen(pos) {
  return pos * viewPortWidth / viewBoxWidth;
}
