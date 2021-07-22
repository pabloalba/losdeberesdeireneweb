let imageWidth = 0;
let imageHeight = 0;

let viewPortWidth = 0;
let viewPortHeight = 0;

let viewBoxWidth = 0;
let viewBoxHeight = 0;

let scrollOffset = 0;

let viewPortElement;
let svgElement;


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

  window.addEventListener("resize", onResize);
  viewPortElement.addEventListener("wheel", onWheel);

  // The resize event does not occur in the initial load,
  // so we call it once here.
  onResize();
}

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

  scrollOffset += event.deltaY;
  scrollOffset = Math.min(scrollOffset, (imageHeight - viewBoxHeight));
  scrollOffset = Math.max(scrollOffset, 0);

  setViewBox();
}


function setViewBox() {
  svgElement.setAttribute("width", viewPortWidth);
  svgElement.setAttribute("height", viewPortHeight);
  svgElement.setAttribute("viewBox",
    "0 " + scrollOffset.toString() + " " +
    viewBoxWidth.toString() + " " + 
    viewBoxHeight.toString());
}
