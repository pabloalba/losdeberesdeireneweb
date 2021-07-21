let imageWidth = 0;
let imageHeight = 0;
let scrollOffset = 0;

export function setupPage(width, height) {
  imageWidth = width;
  imageHeight = height;

  window.addEventListener("resize", onResize);

  // The resize event does not occur in the initial load. Here
  // we wait for the document to be fully loaded, and then call
  // resize function once.
  if (document.readyState != "loading") {
    onResize();
  } else {
    document.addEventListener("DOMContentLoaded", onResize);
  }
}

export function onResize() {
  // On window resize, set the viewpor size to ocuppy all the available
  // space, and zoom the image to fit the viewport width.
  const viewPortElement = document.getElementById("page-viewport");
  const viewPortWidth = viewPortElement.offsetWidth;
  const viewPortHeight = viewPortElement.offsetHeight;

  const ratio = viewPortHeight / viewPortWidth;

  const viewBoxWidth = imageWidth;
  const viewBoxHeight = imageWidth * ratio;

  const svgElement = viewPortElement.querySelectorAll("svg")[0];
  svgElement.setAttribute("width", viewPortWidth);
  svgElement.setAttribute("height", viewPortHeight);
  svgElement.setAttribute("viewBox",
    "0 " + scrollOffset.toString() + " " +
    viewBoxWidth.toString() + " " + 
    viewBoxHeight.toString());
}

