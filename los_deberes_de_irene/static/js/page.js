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


let currentFontSize;
let currentColor;

let cursor;
let labelBg;
let tempLine;
let tempCircle1;
let tempCircle2;
let linesElement;
let lineAreasElement;
let currentLine = null;

let lineMode = false;
let showTempLine = false;

const LABEL_ID_PREFIX = "label-";
const NEW_LABEL_ID = "label-new";
const LINE_ID_PREFIX = "line-";
const LINE_AREA_ID_PREFIX = "line-area-";
const NEW_LINE_ID = "line-new";
const NEW_LINE_AREA_ID = "line-area-new";


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
  svgElement.addEventListener("mousemove", onMouseMove);

  document.getElementById("go-back-button").addEventListener("click", goBack);

  document.getElementById("line-button").addEventListener("click", startDrawLine);

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

  document.getElementById("line-button").classList.remove("selected"); 

  cursor = document.getElementById("cursor");
  labelBg = document.getElementById("label-bg");
  tempLine = document.getElementById("temp-line");
  tempCircle1 = document.getElementById("temp-circle1");
  tempCircle2 = document.getElementById("temp-circle2");
  linesElement = document.getElementById("lines");
  lineAreasElement = document.getElementById("line-areas");

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
  lineMode = false;
  document.getElementById("line-button").classList.remove("selected");
  for (let lineElement of document.querySelectorAll(".page-line")) {
    lineElement.removeEventListener("click", onClickLine);
  }

  for (let lineElement of document.querySelectorAll(".page-line-area")) {
    lineElement.removeEventListener("click", onClickLine);
  }

  for (let labelElement of document.querySelectorAll(".page-label")) {
    labelElement.addEventListener("click", onClickLabel);
  }

  if (currentLabel !=null){
    currentLabel.setAttribute("data-font-size", currentFontSize);
    currentLabel.setAttribute("style", "font-size: " + getFontSize(currentFontSize));
    selectLabel(currentLabel);
  }
}


function changeColor(event) {
  const buttonElement = this;
  currentColor = buttonElement.getAttribute("data-color");
  setSelectedButton(".color-button", "data-color", currentColor);
  if (showTempLine){
    tempLine.setAttribute("stroke", currentColor);
    tempCircle1.setAttribute("fill", currentColor);
    tempCircle2.setAttribute("fill", currentColor);
  } else if (currentLine){
    currentLine.setAttribute("stroke", currentColor);
    tempCircle1.setAttribute("fill", currentColor);
    tempCircle2.setAttribute("fill", currentColor);
    sendUpdateLine(currentLine);
  }

  if (currentLabel !=null){
    currentLabel.setAttribute("data-color", currentColor);
    selectLabel(currentLabel);
  }
}


function onClick(event) {
  event.preventDefault();

  if (viewPortElement) {
    let x = Math.round(screenToImage(event.offsetX));
    let y = Math.round(screenToImage(event.offsetY) + scrollOffset);

    if (lineMode){
      workOnLine(x, y);
    } else {
      const label = createLabel(x, y, "");
      selectLabel(label);
    }
  }
}

function onMouseMove(event){
  event.preventDefault();

  if (viewPortElement) {
    if (showTempLine){      
      let x = Math.round(screenToImage(event.offsetX));
      let y = Math.round(screenToImage(event.offsetY) + scrollOffset);
      tempLine.setAttribute("x2", x);
      tempLine.setAttribute("y2", y);

      tempCircle2.setAttribute("cx", x);
      tempCircle2.setAttribute("cy", y);
    }
  }
}

function workOnLine(x, y){
  if (!showTempLine){        
    currentLine = null;
    tempLine.setAttribute("x1", x);
    tempLine.setAttribute("y1", y);
    tempLine.setAttribute("x2", x);
    tempLine.setAttribute("y2", y);
    tempLine.setAttribute("stroke", currentColor);

    tempCircle1.setAttribute("cx", x);
    tempCircle1.setAttribute("cy", y);
    tempCircle1.setAttribute("fill", currentColor);
    tempCircle1.setAttribute("r", 10);
    tempCircle2.setAttribute("cx", x);
    tempCircle2.setAttribute("cy", y);
    tempCircle2.setAttribute("fill", currentColor);
    tempCircle2.setAttribute("r", 10);
    showTempLine = true;
  } else {
    const line = createLine();
    clearLine();
    selectLine(line);
    sendCreateLine(line);
  }
}


function startDrawLine(event) {
  event.preventDefault();

  if (viewPortElement) {
    setSelectedButton(".size-button", "data-font-size", -1);
    document.getElementById("line-button").classList.add("selected");    
    selectLabel(null);
    clearLine();

    for (let lineElement of document.querySelectorAll(".page-line")) {
      lineElement.addEventListener("click", onClickLine);
    }
  
    for (let lineElement of document.querySelectorAll(".page-line-area")) {
      lineElement.addEventListener("click", onClickLine);
    }

    for (let labelElement of document.querySelectorAll(".page-label")) {
      labelElement.removeEventListener("click", onClickLabel);
    }
  }
}

function clearLine(){
  lineMode = true;    
  tempLine.setAttribute("x1", 0);
  tempLine.setAttribute("y1", 0);
  tempLine.setAttribute("x2", 0);
  tempLine.setAttribute("y2", 0);

  tempCircle1.setAttribute("cx", 0);
  tempCircle1.setAttribute("cy", 0);
  tempCircle1.setAttribute("r", 0);
  tempCircle2.setAttribute("cx", 0);
  tempCircle2.setAttribute("cy", 0);
  tempCircle2.setAttribute("r", 0);

  showTempLine = false;
}


function onClickLabel(event) {
  event.preventDefault();
  event.stopPropagation();

  if (viewPortElement) {
    if (!lineMode){
      selectLabel(event.target);
    }
  }
}

function selectLabel(label){
    if (currentLabel != null) {
        sendCreateOrUpdateLabel(currentLabel);
    }
    currentLabel = label;
    updateCursor();
    if (label !=null){      
      labelInputElement.value = currentLabel.textContent;
      labelInputElement.focus();
    }
}



 function updateCursor(){
    if (currentLabel != null){
        const fontSize = getFontSize(currentLabel.getAttribute("data-font-size"));
        const x = Number(currentLabel.getAttribute("x")) + currentLabel.getBBox().width;
        cursor.setAttribute("x", x);
        cursor.setAttribute("y", (currentLabel.getAttribute("y") - fontSize + 10));
        cursor.setAttribute("height", fontSize);
        cursor.setAttribute("fill", currentColor);

        labelBg.setAttribute("x", currentLabel.getAttribute("x"));
        labelBg.setAttribute("y", currentLabel.getAttribute("y") - fontSize);
        labelBg.setAttribute("width", currentLabel.getBBox().width);
        labelBg.setAttribute("height", fontSize + 10);
    } else {
      cursor.setAttribute("x", -10000);
      labelBg.setAttribute("x", -10000);
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
    } else if ((46 == e.which || 8 == e.which) && lineMode){
      e.preventDefault();
      deleteLine();
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
            document.location = document.getElementById("go-back-button").getAttribute("data-url");
        });
    } else {
        document.location = document.getElementById("go-back-button").getAttribute("data-url");
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

function createLine() {
  const lineAreaElement = document.createElementNS("http://www.w3.org/2000/svg", "line");
  lineAreaElement.setAttribute("id", NEW_LINE_AREA_ID);
  lineAreaElement.setAttribute("class", "page-line");
  lineAreaElement.setAttribute("x1", tempLine.getAttribute("x1"));
  lineAreaElement.setAttribute("y1", tempLine.getAttribute("y1"));
  lineAreaElement.setAttribute("x2", tempLine.getAttribute("x2"));
  lineAreaElement.setAttribute("y2", tempLine.getAttribute("y2"));    
  lineAreaElement.setAttribute("stroke", tempLine.getAttribute("stroke"));
  lineAreaElement.setAttribute("stroke-width", 40);
  lineAreaElement.setAttribute("stroke-opacity", "0%");
  lineAreaElement.addEventListener("click", onClickLine);
  lineAreasElement.appendChild(lineAreaElement);


  const lineElement = document.createElementNS("http://www.w3.org/2000/svg", "line");
  lineElement.setAttribute("id", NEW_LINE_ID);
  lineElement.setAttribute("class", "page-line-area");
  lineElement.setAttribute("x1", tempLine.getAttribute("x1"));
  lineElement.setAttribute("y1", tempLine.getAttribute("y1"));
  lineElement.setAttribute("x2", tempLine.getAttribute("x2"));
  lineElement.setAttribute("y2", tempLine.getAttribute("y2"));  
  lineElement.setAttribute("stroke", tempLine.getAttribute("stroke"));
  lineElement.setAttribute("stroke-width", 8);
  lineElement.addEventListener("click", onClickLine);
  linesElement.appendChild(lineElement);
  return lineElement;
}

function deleteLine(){
  if (currentLine != null){
    let id = currentLine.id.substring(4);
    let currentArea = document.getElementById("line-area"+id);
    linesElement.removeChild(currentLine);
    lineAreasElement.removeChild(currentArea);
    clearLine();
    currentLine.setAttribute("stroke", "");
    sendUpdateLine(currentLine);

    currentArea.remove()
    currentLine.remove();        
    currentLine = null;
  } else {
    clearLine();
  }
}

function onClickLine(event) {
  event.preventDefault();
  event.stopPropagation(); 
  if (lineMode){
    let lineId = event.target.id;
    if (lineId.startsWith("line-area")){
      lineId = "line" + lineId.substring(9);
    }
    selectLine(document.getElementById(lineId));
  }
}

function selectLine(line){  
  currentLine = line;
  tempCircle1.setAttribute("cx", currentLine.getAttribute("x1"));
  tempCircle1.setAttribute("cy", currentLine.getAttribute("y1"));
  tempCircle1.setAttribute("r", 10);
  tempCircle1.setAttribute("fill", currentLine.getAttribute("stroke"));
  tempCircle2.setAttribute("cx", currentLine.getAttribute("x2"));
  tempCircle2.setAttribute("cy", currentLine.getAttribute("y2"));
  tempCircle2.setAttribute("r", 10);
  tempCircle2.setAttribute("fill", currentLine.getAttribute("stroke"));
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
          const labelElement = document.getElementById(NEW_LABEL_ID);
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
  } else {
    if (callback){
      callback();
    }
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


function sendCreateLine(line, callback) {
      let xhr = new XMLHttpRequest();
      xhr.open("POST", "/pages/" + pageId.toString() + "/lines");
      xhr.setRequestHeader("Content-Type", "application/json");

      xhr.onload = function() {
        if (xhr.status != 200) {
          console.error("ERROR on save: ", xhr.statusText);
        } else {
          const line = JSON.parse(xhr.response)[0];
          const lineElement = document.getElementById(NEW_LINE_ID);
          if (lineElement) {
            lineElement.setAttribute("id", LINE_ID_PREFIX + line.pk.toString());
          }
          const lineAreaElement = document.getElementById(NEW_LINE_AREA_ID);
          if (lineAreaElement) {
            lineAreaElement.setAttribute("id", LINE_AREA_ID_PREFIX + line.pk.toString());
          }
          if (callback){
            callback();
          }
        }
      };

      xhr.send(JSON.stringify({
        "x1": line.getAttribute("x1"),
        "y1": line.getAttribute("y1"),
        "x2": line.getAttribute("x2"),
        "y2": line.getAttribute("y2"),        
        "color": line.getAttribute("stroke")
      }));  
}

function sendUpdateLine(line, callback) {
  const lineId = line.id.slice(LINE_ID_PREFIX.length);

  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/pages/" + pageId.toString() + "/lines/" + lineId);
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
    "color": line.getAttribute("stroke")
  }));
}
