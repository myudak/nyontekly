'use strict';
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const PNG = Buffer.from([137,80,78,71,13,10,26,10]);
const validPng = b => Buffer.isBuffer(b) && b.length > 8 && b.subarray(0,8).equals(PNG);
async function verifyDirectory(dir) {
  if(typeof dir!=='string'||!path.isAbsolute(dir))throw new Error('Choose the installed cleaner folder first.');
  for(const name of ['modeling.py','pyproject.toml',path.join('weights','latent_residual.pt')]){
    try{if(!(await fs.stat(path.join(dir,name))).isFile())throw Error();}catch{throw new Error('Cleaner folder must contain modeling.py, pyproject.toml, and weights/latent_residual.pt.');}
  }
  return dir;
}
async function runCleaner({dir,bytes,alpha,device,tile=false,onProgress=()=>{},spawnFn=spawn,signal}) {
  await verifyDirectory(dir);
  if(!validPng(bytes) || bytes.length>40_000_000)throw new Error('Use a PNG image smaller than 40 MB.');
  if(typeof alpha!=='number'||!Number.isFinite(alpha)||alpha<0||alpha>1.5)throw new Error('Strength must be between 0 and 1.5.');
  if(!['auto','cpu','cuda'].includes(device))throw new Error('Invalid device.');
  if(signal?.aborted)throw new Error('Cleaning cancelled.');
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'nyontekly-cleaner-'));
  try {
    const input=path.join(temp,'input.png'),out=path.join(temp,'out');await fs.writeFile(input,bytes);await fs.mkdir(out);
    const args=['run','modeling.py','-i',input,'-o',out,'--alpha',String(alpha),'--format','png','--compile','off','--workers','0'];
    if(device!=='auto')args.push('--device',device);if(tile)args.push('--tile');
    await new Promise((resolve,reject)=>{
      let child,logs='',settled=false,timer,reason=null;
      const done=(error)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);error?reject(error):resolve();};
      const stop=(why)=>{reason=new Error(why);if(!child)return done(reason);if(process.platform==='win32'&&child.pid)spawn('taskkill',['/pid',String(child.pid),'/t','/f'],{windowsHide:true,stdio:'ignore'}).on('error',()=>child.kill());else {try{if(child.pid)process.kill(-child.pid,'SIGTERM');else child.kill();}catch{child.kill();}}};
      const abort=()=>stop('Cleaning cancelled.');
      try{child=spawnFn('uv',args,{cwd:dir,windowsHide:true,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});}catch(e){done(e);return;}
      timer=setTimeout(()=>stop('Cleaning timed out after 30 minutes.'),30*60*1000);
      signal?.addEventListener('abort',abort,{once:true});
      if(signal?.aborted){abort();return;}
      const handle=chunk=>{const text=chunk.toString();logs=(logs+text).slice(-4000);onProgress(text.slice(-500));};child.stdout?.on('data',handle);child.stderr?.on('data',handle);
      child.on('error',e=>done(new Error(e.code==='ENOENT'?'uv was not found. Install uv and restart Nyontekly.':e.message)));
      child.on('close',code=>done(reason || (code===0?null:new Error(`Cleaner exited (${code}). ${logs.slice(-1500)}`))));
    });
    let output;try{output=await fs.readFile(path.join(out,'input.png'));}catch{throw new Error('Cleaner did not produce an output image.');}
    if(!validPng(output)||output.length>40_000_000)throw new Error('Cleaner output is invalid or too large.');
    return output;
  } finally {await fs.rm(temp,{recursive:true,force:true});}
}
module.exports={runCleaner,verifyDirectory,validPng};
