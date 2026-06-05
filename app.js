// Replace with your Apps Script URL
const API_URL = "https://script.google.com/macros/s/AKfycbxOpQxNlJO3E9voMNP3Ai2y6YDBSZw1erOG-wDGc-eKOdW5TghBwKwj7VlTjCqa0Xup1Q/exec";

let plots = {};
let activePlot = null;
let originalColors = {};

async function loadSheetData(){
 if(API_URL.startsWith("http")){
   try {
     const r = await fetch(API_URL);
     const data = await r.json();
     console.log(`Loaded ${data.length} plots from API`);
     data.forEach(p=>plots[p.Plot.replace(/\s/g,'').toUpperCase()] = p);
   } catch (error) {
     console.error('Failed to load plot data:', error);
   }
 }
}

function colorForStatus(status){
 switch((status||'').toLowerCase()){
  case 'available': return '#22c55e';
  case 'booked': return '#ef4444';
  case 'hold': return '#eab308';
  case 'sold': return '#6b7280';
  default: return '#60a5fa';
 }
}

function getClickColorForStatus(status){
 switch((status||'').toLowerCase()){
  case 'available': return '#16a34a';
  case 'booked': return '#dc2626';
  case 'hold': return '#d97706';
  case 'sold': return '#4b5563';
  default: return '#2563eb';
 }
}

function showPlot(id){
 console.log(`showPlot called with id: ${id}`);
 
 const svgDoc = document.getElementById('svgObject').contentDocument;
 if(!svgDoc) {
   console.error('SVG document not loaded yet');
   return;
 }
 
 const allElements = svgDoc.querySelectorAll('*');
 console.log(`Found ${allElements.length} elements in SVG`);
 
 let plotElement = null;
 
 allElements.forEach(element => {
   let elementId = null;
   
   if(element.tagName === 'text' && element.textContent.trim()) {
     elementId = element.textContent.replace(/\s/g,'').toUpperCase();
   } else if(element.id && /^[ABCDE]\d+$/i.test(element.id)) {
     elementId = element.id.toUpperCase();
   } else if(element.getAttribute('data-plot')) {
     elementId = element.getAttribute('data-plot').toUpperCase();
   } else if(element.textContent && /^[ABCDE]\d+$/i.test(element.textContent.trim())) {
     elementId = element.textContent.trim().toUpperCase();
   }
   
   if(elementId === id) {
     plotElement = element;
   }
 });
 
 if(!plotElement) {
   console.error(`Plot element not found for id: ${id}`);
   return;
 }
 
 console.log(`Found plot element for ${id}, applying color changes...`);
 
 if(activePlot) {
   let prevId = null;
   if(activePlot.tagName === 'text' && activePlot.textContent.trim()) {
     prevId = activePlot.textContent.replace(/\s/g,'').toUpperCase();
   } else if(activePlot.id && /^[ABCDE]\d+$/i.test(activePlot.id)) {
     prevId = activePlot.id.toUpperCase();
   } else if(activePlot.getAttribute('data-plot')) {
     prevId = activePlot.getAttribute('data-plot').toUpperCase();
   } else if(activePlot.textContent && /^[ABCDE]\d+$/i.test(activePlot.textContent.trim())) {
     prevId = activePlot.textContent.trim().toUpperCase();
   }
   
   if(prevId) {
     const prevStatus = plots[prevId]?.Status;
     if(originalColors[prevId]) {
       activePlot.setAttribute('fill', originalColors[prevId]);
     } else if(prevStatus) {
       activePlot.setAttribute('fill', colorForStatus(prevStatus));
     }
     activePlot.removeAttribute('stroke');
     activePlot.removeAttribute('stroke-width');
   }
 }
 
 const p = plots[id] || {};
 const status = p.Status;
 originalColors[id] = plotElement.getAttribute('fill');
 
 plotElement.setAttribute('fill', getClickColorForStatus(status));
 plotElement.setAttribute('stroke', '#ffffff');
 plotElement.setAttribute('stroke-width', '1');
 activePlot = plotElement;
 
 console.log(`Plot ${id} activated, showing details panel`);
 
 const panel = document.getElementById('panel');
 panel.style.display = 'block';
 panel.innerHTML = `
 <button class="close-btn" onclick="document.getElementById('panel').style.display='none'">&times;</button>
 <h2>${id}</h2>
 <p><b>Size:</b> ${p.Size||''}</p>
 <p><b>Area:</b> ${p.Area||''} sqft</p>
 <p><b>Price:</b> ${p.Price||''}</p>
 <p><b>Status:</b> ${p.Status||''}</p>
 <p><b>Facing:</b> ${p.Facing||''}</p>
 <a target="_blank" href="https://wa.me/${p.AgentPhone||''}?text=Interested in plot ${id}">WhatsApp Enquiry</a>`;
}

function searchPlot(){
 showPlot(document.getElementById('searchBox').value.replace(/\s/g,'').toUpperCase());
}

function applyFilter(){
 const filter=document.getElementById('filter').value;
 const svgDoc=document.getElementById('svgObject').contentDocument;
 if(!svgDoc) return;

 const allElements = svgDoc.querySelectorAll('*');
 
 allElements.forEach(element => {
   let id = null;
   
   if(element.tagName === 'text' && element.textContent.trim()) {
     id = element.textContent.replace(/\s/g,'').toUpperCase();
   } else if(element.id && /^[ABCDE]\d+$/i.test(element.id)) {
     id = element.id.toUpperCase();
   } else if(element.getAttribute('data-plot')) {
     id = element.getAttribute('data-plot').toUpperCase();
   } else if(element.textContent && /^[ABCDE]\d+$/i.test(element.textContent.trim())) {
     id = element.textContent.trim().toUpperCase();
   }
   
   if(id && /^[ABCDE]\d+$/.test(id)) {
     const p=plots[id];
     if(!p){element.style.opacity=1;return;}
     element.style.opacity=(!filter || p.Status===filter)?1:0.2;
     
     if(element === activePlot) {
       const status = p.Status;
       element.setAttribute('fill', getClickColorForStatus(status));
     }
   }
 });
}

document.getElementById('svgObject').addEventListener('load', async ()=>{
 console.log('SVG loaded, initializing...');
 
 await loadSheetData();
 console.log(`Loaded ${Object.keys(plots).length} plots into memory`);

 const svgDoc = document.getElementById('svgObject').contentDocument;
 if(!svgDoc) {
   console.error('SVG content document not accessible');
   return;
 }
 
 const svg = svgDoc.querySelector('svg');
 if(svg) {
   console.log('SVG element found, initializing pan/zoom');
   svgPanZoom(svg,{zoomEnabled:true,controlIconsEnabled:true});
 }

 let plotCount = 0;
 
 const allElements = svgDoc.querySelectorAll('*');
 console.log(`Found ${allElements.length} total elements in SVG`);
 
 allElements.forEach(element => {
   let id = null;
   
   if(element.tagName === 'text' && element.textContent.trim()) {
     id = element.textContent.replace(/\s/g,'').toUpperCase();
   } else if(element.id && /^[ABCDE]\d+$/i.test(element.id)) {
     id = element.id.toUpperCase();
   } else if(element.getAttribute('data-plot')) {
     id = element.getAttribute('data-plot').toUpperCase();
   }
   
   if(id && /^[ABCDE]\d+$/.test(id)) {
      element.style.cursor = 'pointer';
      const p = plots[id];
      const color = colorForStatus(p?.Status);
      element.setAttribute('fill', color);
      originalColors[id] = color;
      element.addEventListener('click', ()=> {
        console.log(`Plot ${id} clicked`);
        showPlot(id);
      });
      plotCount++;
   }
 });
 
 if(plotCount === 0) {
   console.warn('No plot elements found! Checking for alternative patterns...');
   
   allElements.forEach(element => {
     const textContent = element.textContent ? element.textContent.trim() : '';
     if(textContent && /^[ABCDE]\d+$/i.test(textContent)) {
       const id = textContent.toUpperCase();
       console.log(`Found potential plot ID in element content: ${id}`);
       element.style.cursor = 'pointer';
       const p = plots[id];
       const color = colorForStatus(p?.Status);
       element.setAttribute('fill', color);
       originalColors[id] = color;
       element.addEventListener('click', ()=> {
         console.log(`Plot ${id} clicked via content`);
         showPlot(id);
       });
       plotCount++;
     }
   });
 }
 
 console.log(`Initialized ${plotCount} plot elements with click handlers`);
 
 if(plotCount === 0) {
   console.error('CRITICAL: No plot elements could be found in the SVG!');
   alert('Warning: Could not find any plot elements in the layout. Please check the SVG structure.');
 }
});

document.addEventListener('DOMContentLoaded', () => {
 console.log('DOM loaded, waiting for SVG...');
 
 document.addEventListener('click', (event) => {
   const panel = document.getElementById('panel');
   const svgObject = document.getElementById('svgObject');
   
   if(panel.style.display === 'block' && 
      !panel.contains(event.target) && 
      !svgObject.contains(event.target)) {
     panel.style.display = 'none';
     
     if(activePlot) {
       let prevId = null;
       if(activePlot.tagName === 'text' && activePlot.textContent.trim()) {
         prevId = activePlot.textContent.replace(/\s/g,'').toUpperCase();
       } else if(activePlot.id && /^[ABCDE]\d+$/i.test(activePlot.id)) {
         prevId = activePlot.id.toUpperCase();
       } else if(activePlot.getAttribute('data-plot')) {
         prevId = activePlot.getAttribute('data-plot').toUpperCase();
       } else if(activePlot.textContent && /^[ABCDE]\d+$/i.test(activePlot.textContent.trim())) {
         prevId = activePlot.textContent.trim().toUpperCase();
       }
       
       if(prevId) {
         const prevStatus = plots[prevId]?.Status;
         if(originalColors[prevId]) {
           activePlot.setAttribute('fill', originalColors[prevId]);
         } else if(prevStatus) {
           activePlot.setAttribute('fill', colorForStatus(prevStatus));
         }
         activePlot.removeAttribute('stroke');
         activePlot.removeAttribute('stroke-width');
         activePlot = null;
       }
     }
   }
 });
});