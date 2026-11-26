// Optimise on the owner's device: no paid image transformation service.
export async function optimisePhoto(file) {
  if(file.size>8*1024*1024)throw new Error('Choose a photo smaller than 8 MB.');
  const bitmap=await createImageBitmap(file);
  try {
    if(bitmap.width*bitmap.height>40000000)throw new Error('Choose a photo smaller than 40 megapixels.');
    const canvas=document.createElement('canvas');
    const scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    let blob;
    for(const quality of [.86,.72,.56]){blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));if(blob&&blob.size<=750000)break;}
    if(!blob||blob.type!=='image/webp'||blob.size>750000)throw new Error('Please choose a smaller photo.');
    return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});
  } finally { bitmap.close(); }
}
