import { AgentAtlas } from "../AgentAtlas";
import "../globals.css";
import "../atlas.css";
import "../hologram.css";

export const metadata = { title: "Agent Atlas — 発展と構成", description: "LLM型Agentの発展と構成を、原資料に基づく3D図と個別解説でたどる。" };
export default function AtlasPage() { return <AgentAtlas />; }
