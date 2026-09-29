import * as THREE from "three";

// Leave a narrow reveal of the physical paper/screen around the HTML page.
export const SURFACE_SCALE = .98;
export function presentationSize(width:number,height:number) {
  const usableWidth = Math.max(100, width - (width <= 900 ? 56 : 140));
  // Desktop slides can use the space between the fixed header and navigation.
  const reservedHeight = height < 620 ? 184 : width >= 1000 ? 194 : 230;
  const usableHeight = Math.max(90, height - reservedHeight);
  if (width <= 900 || height < 620) return {width:Math.min(1120,usableWidth),height:usableHeight};
  const w = Math.min(1120, usableWidth, usableHeight * 1.76);
  return {width:w,height:width<=1200?usableHeight:w/1.76};
}

// Map the HTML rectangle to the four screen-space corners of the real mesh.
// This keeps selectable, accessible text on the model without a texture capture
// or an unrelated screen-space card. Perspective and browser zoom use CSS pixels.
export function projectSurface(element:HTMLElement,face:THREE.Object3D,physicalWidth:number,physicalHeight:number,camera:THREE.Camera,viewportWidth:number,viewportHeight:number,htmlWidth:number,htmlHeight:number) {
  const project = (scale:number) => [[-.5,.5],[.5,.5],[.5,-.5],[-.5,-.5]].map(([x,y])=>{
    const p=new THREE.Vector3(x*physicalWidth*scale,y*physicalHeight*scale,.00015).applyMatrix4(face.matrixWorld).project(camera);
    return {x:(p.x*.5+.5)*viewportWidth,y:(-.5*p.y+.5)*viewportHeight,z:p.z};
  });
  const points=project(SURFACE_SCALE);
  const mesh=project(1);
  element.dataset.surfaceBounds=JSON.stringify({left:Math.min(...mesh.map(p=>p.x)),right:Math.max(...mesh.map(p=>p.x)),top:Math.min(...mesh.map(p=>p.y)),bottom:Math.max(...mesh.map(p=>p.y))});
  const [p0,p1,p2,p3]=points;
  const dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x;
  const dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y;
  const denominator=dx1*dy2-dx2*dy1;
  if(Math.abs(denominator)<.00001||points.some(p=>p.z>1))return false;
  const g=(dx3*dy2-dx2*dy3)/denominator,h=(dx1*dy3-dx3*dy1)/denominator;
  const matrix=[(p1.x-p0.x+g*p1.x)/htmlWidth,(p1.y-p0.y+g*p1.y)/htmlWidth,0,g/htmlWidth,(p3.x-p0.x+h*p3.x)/htmlHeight,(p3.y-p0.y+h*p3.y)/htmlHeight,0,h/htmlHeight,0,0,1,0,p0.x,p0.y,0,1];
  element.style.width=`${htmlWidth}px`;element.style.height=`${htmlHeight}px`;element.style.transform=`matrix3d(${matrix.join(",")})`;
  return true;
}
