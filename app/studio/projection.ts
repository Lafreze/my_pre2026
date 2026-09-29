import * as THREE from "three";

export function presentationSize(width:number,height:number) {
  if(width<=900) return {width:Math.max(250,width-36),height:Math.max(310,height-190)};
  const w=Math.min(1120,width-140,(height-200)*1.76);
  return {width:w,height:w/1.76};
}

// Map the HTML rectangle to the four screen-space corners of the real mesh.
// This keeps selectable, accessible text on the model without a texture capture
// or an unrelated screen-space card. Perspective and browser zoom use CSS pixels.
export function projectSurface(element:HTMLElement,face:THREE.Object3D,physicalWidth:number,physicalHeight:number,camera:THREE.Camera,viewportWidth:number,viewportHeight:number,htmlWidth:number,htmlHeight:number) {
  const points=[[-.5,.5],[.5,.5],[.5,-.5],[-.5,-.5]].map(([x,y])=>{
    const p=new THREE.Vector3(x*physicalWidth,y*physicalHeight,.00015).applyMatrix4(face.matrixWorld).project(camera);
    return {x:(p.x*.5+.5)*viewportWidth,y:(-.5*p.y+.5)*viewportHeight,z:p.z};
  });
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
