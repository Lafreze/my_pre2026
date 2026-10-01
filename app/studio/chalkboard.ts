/** Original chalk sketch, following the encoder block in Attention Is All You Need. */
export function drawTransformerNotes(c:CanvasRenderingContext2D) {
  c.fillStyle="#1d3833";c.fillRect(0,0,1600,800);
  let seed=43;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<5500;i++){c.fillStyle=`rgba(217,228,207,${random()*.042})`;c.fillRect(random()*1600,random()*800,random()*6+1,1);}
  c.lineCap="round";c.lineJoin="round";c.lineWidth=2.5;c.strokeStyle="#d4dfcf";c.fillStyle="#e3ead7";
  const text=(s:string,x:number,y:number,size=27,color="#dae3d0")=>{c.font=`${size}px "Chalkboard SE", "Comic Sans MS", sans-serif`;c.fillStyle=color;c.fillText(s,x,y);};
  const arrow=(x:number,y:number,xx:number,yy:number)=>{c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);const a=Math.atan2(yy-y,xx-x);c.moveTo(xx-10*Math.cos(a-.5),yy-10*Math.sin(a-.5));c.lineTo(xx,yy);c.lineTo(xx-10*Math.cos(a+.5),yy-10*Math.sin(a+.5));c.stroke();};
  text("TRANSFORMER",65,86,48);text("attention / representation / sequence",68,132,23,"#a1b8a6");
  c.strokeStyle="#bccaac";c.beginPath();c.moveTo(65,152);c.lineTo(714,152);c.stroke();
  text("Attention(Q, K, V)",75,232,35);text("= softmax",97,297,36);text("QKᵀ",343,273,34);text("√dₖ",347,321,31);c.beginPath();c.moveTo(329,282);c.lineTo(426,282);c.stroke();text("(          ) V",302,299,36);
  text("Q = XW_Q    K = XW_K    V = XW_V",77,387,27);
  text("one sequence, multiple views",78,466,24,"#d4c395");
  for(let i=0;i<6;i++){c.strokeStyle=i===2?"#d9c496":"#a5bcad";c.strokeRect(78+i*102,513,75,54);text(["x₁","x₂","x₃","x₄","x₅","x₆"][i],96+i*102,550,27);arrow(115+i*102,580,115+i*102,636);}
  text("token embeddings + position",79,684,27);text("Vaswani et al. · 2017",80,747,20,"#9db5a7");
  // Post-norm encoder: residual connections wrap attention and FFN separately.
  const blocks=[[600,"Multi-head attention"],[478,"Add & Norm"],[356,"Feed forward"],[234,"Add & Norm"]] as const;
  c.strokeStyle="#c2d5c2";
  for(const [y,label] of blocks){c.strokeRect(974,y,452,74);text(label,1000,y+46,28);arrow(1200,y,1200,y-40);}
  text("ENCODER BLOCK",994,122,31,"#ddc895");text("× N",1460,435,27,"#ddc895");
  arrow(1200,742,1200,684);text("embeddings",1020,774,22);
  for(const [bottom,top] of [[706,515],[433,271]]){c.beginPath();c.moveTo(1200,bottom);c.lineTo(906,bottom);c.lineTo(906,top);c.lineTo(974,top);c.stroke();text("+",944,top-10,25,"#ddc895");}
  text("FFN(x) = max(0, xW₁ + b₁)W₂ + b₂",903,183,20,"#aec7b5");
}
