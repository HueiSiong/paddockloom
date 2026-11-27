export const shirtMeasurements=[['S',100,70,36],['M',104,72,37],['L',108,74,38],['XL',112,76,39],['2XL',116,78,40],['3XL',120,80,41],['4XL',124,82,42]];
export function sizeGuide(category){
 if(category!=='Shirts')return '';
 return `<details class="size-guide"><summary>Shirt size guide · cm</summary><p>Shared Mercedes reference chart, used as a guide across the shirt collection. Confirm the measurements of your chosen design before ordering.</p><div class="size-table-wrap"><table><caption>Garment measurements in centimetres</caption><thead><tr><th scope="col">Size</th><th scope="col">Chest</th><th scope="col">Length</th><th scope="col">Sleeve</th></tr></thead><tbody>${shirtMeasurements.map(r=>`<tr>${r.map((x,i)=>i===0?`<th scope="row">${x}</th>`:`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
}
