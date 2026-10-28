'use strict';
const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const path = require('node:path');
const COLORS=['yellow','green','blue','purple','pink'];
function clean(input){if(!input || typeof input !== 'object')throw new Error('Invalid note.');const title=String(input.title??'').slice(0,100),body=String(input.body??'').slice(0,30000),color=COLORS.includes(input.color)?input.color:'yellow',archived=input.archived===true;return {title,body,color,archived};}
class StickyStore {
 constructor(file){this.file=file;this.queue=Promise.resolve();}
 async read(){try{const data=JSON.parse(await fs.readFile(this.file,'utf8'));if(!Array.isArray(data))throw Error('Invalid notes data');return data;}catch(e){if(e.code==='ENOENT')return [];throw new Error('Could not read sticky notes; original file was not changed.');}}
 async list(){await this.queue;return this.read();}
 mutate(fn){const task=this.queue.then(async()=>{const notes=await this.read();const result=fn(notes);await fs.mkdir(path.dirname(this.file),{recursive:true});const tmp=this.file+'.'+crypto.randomUUID()+'.tmp';try{await fs.writeFile(tmp,JSON.stringify(notes,null,2),{mode:0o600});await fs.rename(tmp,this.file);}finally{await fs.rm(tmp,{force:true});}return result;});this.queue=task.catch(()=>{});return task;}
 create(input){return this.mutate(notes=>{if(notes.length>=1000)throw Error('Note limit reached.');const now=new Date().toISOString(),n={id:crypto.randomUUID(),...clean(input),createdAt:now,updatedAt:now};notes.unshift(n);return n;});}
 update(id,input){return this.mutate(notes=>{const i=notes.findIndex(n=>n.id===id);if(i<0)throw Error('Note not found.');notes[i]={...notes[i],...clean(input),updatedAt:new Date().toISOString()};return notes[i];});}
 remove(id){return this.mutate(notes=>{const i=notes.findIndex(n=>n.id===id);if(i<0)throw Error('Note not found.');notes.splice(i,1);return true;});}
}
module.exports={StickyStore,clean};
