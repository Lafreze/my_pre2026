export const sceneProps = [
  {id:"rear-curtain", title:"窓辺のカーテン"},
  {id:"left-curtain", title:"窓辺のカーテン"},
  {id:"desk-lamp", title:"デスクライト"},
  {id:"floor-lamp", title:"フロアライト"},
  {id:"chalkboard", title:"黒板"},
  {id:"gramophone", title:"蓄音機"},
  {id:"coffee", title:"コーヒー"},
  {id:"sofa", title:"読書のソファ"},
  {id:"chair", title:"ワークチェア"},
  {id:"plant", title:"窓辺の緑"},
  {id:"cabinet", title:"レコードキャビネット"},
  {id:"clock", title:"時計"},
  {id:"robot", title:"お掃除ロボット"},
] as const;
export type ScenePropId = typeof sceneProps[number]["id"];
export type ChalkTool = "chalk" | "eraser";
