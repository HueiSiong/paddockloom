export const shirtMeasurements=[['S',100,70,36],['M',104,72,37],['L',108,74,38],['XL',112,76,39],['2XL',116,78,40],['3XL',120,80,41],['4XL',124,82,42]];
export function sizeGuide(category){
 if(category!=='Shirts')return '';
 return `<details class="size-guide"><summary>Size guide</summary><p>Compare these measurements with a shirt you own. Fit can vary by style; contact us if you need help choosing a size.</p><div class="size-table-wrap"><table><caption>Shirt measurements in cm</caption><thead><tr><th scope="col">Size</th><th scope="col">Chest</th><th scope="col">Length</th><th scope="col">Sleeve</th></tr></thead><tbody>${shirtMeasurements.map(r=>`<tr>${r.map((x,i)=>i===0?`<th scope="row">${x}</th>`:`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
}
