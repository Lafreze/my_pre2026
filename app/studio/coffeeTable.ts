import * as T from "three";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";
import {createSurfaceMaterials,metricUV} from "../surfaceMaterials";

/** A 44 cm coffee table: the long axis follows the sofa, with a clear seated reach. */
export function createCoffeeTable(finishes:ReturnType<typeof createSurfaceMaterials>) {
  const root=new T.Group();root.name="Rounded oak coffee table";root.position.set(.40,0,.80);
  const oak=finishes.material("oak","#d8c3a0"),edge=finishes.material("wood","#aa8d64"),paper=finishes.material("paper","#eee6d6");
  function mesh(g:T.BufferGeometry,m:T.Material,p:[number,number,number],parent:T.Object3D=root){const o=new T.Mesh(g,m);o.position.set(...p);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const box=(s:[number,number,number],p:[number,number,number],m:T.Material,parent=root)=>mesh(metricUV(new RoundedBoxGeometry(...s,3,Math.min(...s)/4)),m,p,parent);
  const outline=new T.Shape(),w=1.06/2,d=1.56/2,r=.25;
  outline.moveTo(-w+r,-d);outline.lineTo(w-r,-d);outline.quadraticCurveTo(w,-d,w,-d+r);outline.lineTo(w,d-r);outline.quadraticCurveTo(w,d,w-r,d);outline.lineTo(-w+r,d);outline.quadraticCurveTo(-w,d,-w,d-r);outline.lineTo(-w,-d+r);outline.quadraticCurveTo(-w,-d,-w+r,-d);
  const topGeometry=metricUV(new T.ExtrudeGeometry(outline,{depth:.035,bevelEnabled:true,bevelSize:.007,bevelThickness:.007,bevelSegments:3,curveSegments:14}));
  const top=mesh(topGeometry,oak,[0,.400,0]);top.rotation.x=-Math.PI/2;
  // Aprons meet the legs below the eased solid-wood edge.
  for(const x of [-.36,.36])box([.04,.047,1.14],[x,.369,0],edge);
  for(const z of [-.55,.55])box([.73,.047,.04],[0,.369,z],edge);
  for(const x of [-.37,.37])for(const z of [-.56,.56]){
    const leg=mesh(new T.CylinderGeometry(.037,.025,.36,24),edge,[x,.217,z]);leg.rotation.z=-Math.sign(x)*.04;leg.rotation.x=Math.sign(z)*.035;
    mesh(new T.CylinderGeometry(.027,.027,.005,24),finishes.material("wool","#776e5c"),[x+Math.sign(x)*.007,.034,z+Math.sign(z)*.006]);
  }
  // Recessed slatted shelf keeps books below the usable tabletop.
  for(const x of [-.35,.35])box([.026,.025,1.16],[x,.148,0],edge);
  for(let i=0;i<10;i++)box([.71,.018,.092],[0,.165,-.50+i*.111],oak);
  for(let i=0;i<2;i++){
    const book=new T.Group();book.position.set(-.03,.18+i*.047,.16);book.rotation.y=.09-i*.15;root.add(book);
    const cloth=finishes.material("fabric",i?"#b5a285":"#697a60");
    box([.35,.032,.26],[0,.019,0],paper,book);
    for(const y of [0,.038])box([.365,.006,.27],[0,y,0],cloth,book);
    box([.009,.04,.27],[-.18,.018,0],cloth,book);
  }
  return root;
}
