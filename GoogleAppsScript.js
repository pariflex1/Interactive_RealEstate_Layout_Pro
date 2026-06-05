function doGet(){
 const sh=SpreadsheetApp.getActive().getSheetByName('Plots');
 const v=sh.getDataRange().getValues();
 const h=v.shift();
 const data=v.map(r=>Object.fromEntries(h.map((x,i)=>[x,r[i]])));
 return ContentService.createTextOutput(JSON.stringify(data))
 .setMimeType(ContentService.MimeType.JSON);
}