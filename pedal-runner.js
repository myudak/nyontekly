'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const {spawn}=require('node:child_process');
async function inspectPedal(dir,platform=process.platform){
 if(typeof dir!=='string'||!path.isAbsolute(dir))throw new Error('Choose the Video Pedal folder first.');
 const python=path.join(dir,'.venv',platform==='win32'?'Scripts':'bin',platform==='win32'?'python.exe':'python');
 for(const file of [path.join(dir,'loop_pedal.py'),python]){try{if(!(await fs.stat(file)).isFile())throw Error();}catch{throw new Error('The folder must contain loop_pedal.py and a configured .venv Python environment.');}}
 return {dir,python};
}
function validateOptions(options){
 if(!options || typeof options!=='object')throw new Error('Invalid settings.');
 const keys=['alt_r','alt_gr','ctrl_r','shift_r','cmd_r','f8','f9','f10','f11','f12','f13','f14','f15'];
 if(!keys.includes(options.key)||!keys.includes(options.liveKey)||options.key===options.liveKey)throw new Error('Choose two different supported keys.');
 if(!['auto','0','1','2','3','4','5'].includes(options.camera))throw new Error('Invalid camera index.');
 if(!['640x480','1280x720','1920x1080'].includes(options.size))throw new Error('Invalid resolution.');
 if(![15,24,30].includes(options.fps))throw new Error('Invalid frame rate.');
 if(!Number.isInteger(options.seconds)||options.seconds<2||options.seconds>60)throw new Error('Maximum loop length must be 2–60 seconds.');
 return options;
}
function makeArgs(options){const o=validateOptions(options);const args=['-u','loop_pedal.py','--key',o.key,'--live-key',o.liveKey,'--size',o.size,'--fps',String(o.fps),'--max-seconds',String(o.seconds)];if(o.camera!=='auto')args.push('--camera',o.camera);if(o.previewOnly)args.push('--no-vcam');if(o.noHotkeys)args.push('--no-pedal');return args;}
class PedalRunner {
 constructor({spawnFn=spawn,onStatus=()=>{}}={}){this.spawnFn=spawnFn;this.onStatus=onStatus;this.child=null;}
 async start(dir,options){if(this.child)throw new Error('Video Pedal is already running.');const {python}=await inspectPedal(dir);const args=makeArgs(options);if(this.child)throw new Error('Video Pedal is already running.');
  const child=this.spawnFn(python,args,{cwd:dir,windowsHide:true,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});this.child=child;this.onStatus({state:'starting',message:'Starting Video Pedal…'});
  const message=d=>this.onStatus({state:'running',message:d.toString().slice(-1000)});child.stdout?.on('data',message);child.stderr?.on('data',message);
  child.on('error',e=>{if(this.child===child){this.child=null;this.onStatus({state:'error',message:e.message});}});
  child.on('close',(code,signal)=>{if(this.child===child){this.child=null;this.onStatus({state:'stopped',message:code===0?'Video Pedal stopped.':`Video Pedal stopped (${signal||code}). Check the output above.`});}});
  return true;
 }
 stop(){const child=this.child;if(!child)return false;this.onStatus({state:'stopping',message:'Stopping Video Pedal…'});if(process.platform==='win32'&&child.pid){spawn('taskkill',['/pid',String(child.pid),'/t','/f'],{windowsHide:true,stdio:'ignore'}).on('error',()=>child.kill());}else{try{if(child.pid)process.kill(-child.pid,'SIGTERM');else child.kill();}catch{child.kill();}}return true;}
}
module.exports={inspectPedal,validateOptions,makeArgs,PedalRunner};
