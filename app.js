
// Replace with your Apps Script URL
const API_URL = "https://script.google.com/macros/s/AKfycbxOpQxNlJO3E9voMNP3Ai2y6YDBSZw1erOG-wDGc-eKOdW5TghBwKwj7VlTjCqa0Xup1Q/exec";

let plots = {};
let activePlot = null;
let originalColors = {};

async function loadSheetData(){
 if(API_URL.startsWith("http")){
   const r = await fetch(API_URL);
   const data = await r.json();
   data.forEach(p=>plots[p.Plot.replace(/\s/g,'').toUpperCase()] = p);
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
 const svgDoc = document.getElementById('svgObject').contentDocument;
 if(!svgDoc) return;
 
 const textElements = svgDoc.querySelectorAll('text');
 let plotText = null;
 
 textElements.forEach(t => {
   const plotId = t.textContent.replace(/\s/g,'').toUpperCase();
   if(plotId === id) {
     plotText = t;
   }
 });
 
 if(plotText) {
   if(activePlot) {
     const prevId = activePlot.textContent.replace(/\s/g,'').toUpperCase();
     const prevStatus = plots[prevId]?.Status;
     if(originalColors[prevId]) {
       activePlot.setAttribute('fill', originalColors[prevId]);
     } else if(prevStatus) {
       activePlot.setAttribute('fill', colorForStatus(prevStatus));
     }
     activePlot.removeAttribute('stroke');
     activePlot.removeAttribute('stroke-width');
   }
   
   const p = plots[id] || {};
   const status = p.Status;
   originalColors[id] = plotText.getAttribute('fill');
   
   plotText.setAttribute('fill', getClickColorForStatus(status));
   plotText.setAttribute('stroke', '#ffffff');
   plotText.setAttribute('stroke-width', '1');
   activePlot = plotText;
 }
 
 const p = plots[id] || {};
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

 svgDoc.querySelectorAll('text').forEach(t=>{
  const id=t.textContent.replace(/\s/g,'').toUpperCase();
  const p=plots[id];
  if(!p){t.style.opacity=1;return;}
  t.style.opacity=(!filter || p.Status===filter)?1:0.2;
  
  if(t === activePlot) {
   const status = p.Status;
   t.setAttribute('fill', getClickColorForStatus(status));
  }
 });
}

document.getElementById('svgObject').addEventListener('load', async ()=>{
 await loadSheetData();

 const svgDoc=document.getElementById('svgObject').contentDocument;
 const svg=svgDoc.querySelector('svg');
 if(svg) svgPanZoom(svg,{zoomEnabled:true,controlIconsEnabled:true});

 svgDoc.querySelectorAll('text').forEach(t=>{
   const id=t.textContent.replace(/\s/g,'').toUpperCase();
   if(/^[ABCDE]\d+$/.test(id)){
      t.style.cursor='pointer';
      const p=plots[id];
      const color = colorForStatus(p?.Status);
      t.setAttribute('fill', color);
      originalColors[id] = color;
      t.addEventListener('click', ()=>showPlot(id));
   }
 });
});
