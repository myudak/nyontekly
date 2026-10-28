// Capture the real Electron shell after it loads; requires a graphical desktop.
const {spawn}=require('node:child_process');
const electron=require('electron');
const child=spawn(electron,['.'],{cwd:require('node:path').join(__dirname,'..'),env:{...process.env,NYONTEKLY_SCREENSHOT:'1'},stdio:'inherit'});
child.on('error',e=>{console.error(e.message);process.exitCode=1});
child.on('exit',code=>{process.exitCode=code??1});
