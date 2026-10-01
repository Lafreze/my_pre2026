/** Original, quietly voiced music. No audio is fetched and nothing autoplays. */
export function createStudioMusic(onChange:(playing:boolean)=>void){
  let context:AudioContext|null=null,master:GainNode|null=null,timer:ReturnType<typeof setInterval>|undefined,playing=false,pending=false,version=0,volume=.22,next=0,beat=0;
  const voices=new Set<OscillatorNode>();
  const chords=[[48,55,60,64,67],[45,52,57,60,64],[41,48,53,57,60],[43,50,55,59,62]];
  function note(midi:number,at:number,gain:number){if(!context||!master)return;const osc=context.createOscillator(),envelope=context.createGain();osc.type="sine";osc.frequency.value=440*2**((midi-69)/12);envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(gain,at+.035);envelope.gain.exponentialRampToValueAtTime(.0001,at+2.5);osc.connect(envelope).connect(master);osc.start(at);osc.stop(at+2.6);voices.add(osc);osc.onended=()=>{voices.delete(osc);osc.disconnect();envelope.disconnect();};}
  function schedule(){if(!context||!playing)return;while(next<context.currentTime+.3){const chord=chords[Math.floor(beat/8)%chords.length];note(chord[[0,2,3,4,1,3,2,4][beat%8]],next,.18);if(beat%8===0)note(chord[0]-12,next,.18);next+=.45;beat++;}}
  function stop(){version++;pending=false;playing=false;if(timer)clearInterval(timer);timer=undefined;voices.forEach(o=>{try{o.stop();}catch{/* Already ended. */}});voices.clear();void context?.suspend();onChange(false);}
  async function toggle(){if(playing||pending){stop();return;}pending=true;const request=++version;try{context??=new AudioContext();if(!master){master=context.createGain();master.gain.value=volume;master.connect(context.destination);}await context.resume();if(request!==version)return;pending=false;if(context.state!=="running")throw new Error("Audio unavailable");playing=true;next=context.currentTime+.04;schedule();timer=setInterval(schedule,150);onChange(true);}catch{stop();}}
  function hidden(){if(document.hidden)stop();}document.addEventListener("visibilitychange",hidden);
  return {toggle,stop,setVolume(value:number){volume=Math.max(0,Math.min(.6,value));if(master&&context)master.gain.setTargetAtTime(volume,context.currentTime,.04);},dispose(){stop();document.removeEventListener("visibilitychange",hidden);void context?.close();}};
}
