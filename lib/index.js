/**
 * local-site HTTP Server
 * 支持通过 Host 请求头智能切换：源文件目录 vs 编译输出目录
 * 采用“主根目录 -> 依次遍历虚拟根目录”的级联查找机制
 */
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import mime from "mime";
import config from "./config.js";
import watchSite from "./watchSite.js";
import addProxy from "./addProxy.js";

function run(){
  const minifyConfig=config.export.minify;
  let hostname=config.hostname;
  let getSourceDir=(_v)=>_v.replace(/[/]*([a-zA-Z0-9]*)\/.*/,"$1");
  let returnError=function(_res,_code){
    _res.writeHead(_code,"",{"Content-Type":"text/html"});
    _res.write(`<h1>${_code} ERR</h1>`);
    _res.end();
  };
  let sendFile=function(filePath,res){
    const ext=path.extname(filePath).slice(1);
    const mimeType=mime.getType(ext) || 'application/octet-stream';
    fs.readFile(filePath,(err,file)=>{
      if(!err){
        res.writeHead(200,{"Content-Type":mimeType});
        res.write(file);
        res.end();
      }
      else{
        returnError(res,404);
      }
    });
  };
  // 递归在目录中按顺序查找默认首页
  let findDefaultPageInDir=function(dirPath,defPages,pageIndex,res,onNotFound){
    if(pageIndex>=defPages.length){
      return onNotFound();
    }
    const defPage=defPages[pageIndex];
    const pagePath=path.join(dirPath,defPage).replace(/\\/g,'/');
    fs.stat(pagePath,(err,stats)=>{
      if(!err && stats.isFile()){
        sendFile(pagePath,res);
      }
      else{
        findDefaultPageInDir(dirPath,defPages,pageIndex+1,res,onNotFound);
      }
    });
  };
  let httpEvent=function(req,res){
    const reqUrl=new URL(req.url,`http://${req.headers.host}`);
    const hostName=reqUrl.hostname;
    const isIpRequest=/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostName) || hostName==='localhost' || hostName==='::1';
    // 根据请求来源智能切换：源目录 vs 编译输出目录
    const currentRoot=isIpRequest ? config.root : config.exportRoot;
    let pathname=reqUrl.pathname;
    // 1. 检查是否为 API 代理请求
    if(getSourceDir(pathname)===getSourceDir(config.apiProxy.watchUrl)){
      addProxy(req,res);
      return false;
    }
    // 2. 构建级联查找路径列表（主根目录优先，随后依次追加各个虚拟根目录）
    let vRoots=config.virtualRoot || [];
    if(typeof vRoots==='string'){
      vRoots=vRoots ? [vRoots] : [];
    }
    const rootPrefixes=[currentRoot];
    for(let vr of vRoots){
      if(vr){
        let cleanVr=vr.startsWith('/') ? vr.slice(1) : vr;
        rootPrefixes.push(path.join(currentRoot,cleanVr));
      }
    }
    const defPages=config.defaultPage && config.defaultPage.length>0 ? config.defaultPage : ["index.html"];
    // 3. 异步按序尝试每一个候选根目录
    let index=0;
    const tryNextRoot=()=>{
      if(index>=rootPrefixes.length){
        return returnError(res,404);
      }
      const currentPrefix=rootPrefixes[index++];
      const candidatePath=path.join(currentPrefix,pathname).replace(/\\/g,'/');
      fs.stat(candidatePath,(err,stats)=>{
        if(!err){
          if(stats.isFile()){
            // 命中文件，直接响应
            sendFile(candidatePath,res);
          }
          else if(stats.isDirectory()){
            // 命中目录，尝试在其中寻找默认首页
            findDefaultPageInDir(candidatePath,defPages,0,res,tryNextRoot);
          }
          else{
            tryNextRoot();
          }
        }
        else{
          // 当前候选路径不存在，尝试下一个
          tryNextRoot();
        }
      });
    };
    tryNextRoot();
  };
  // === 启动服务 ===
  http.createServer(httpEvent).listen(config.port,hostname);
  let httpsStarted=false;
  if(config.https.enable){
    const keyPath=path.resolve(config.https.key);
    const certPath=path.resolve(config.https.cert);
    if(fs.existsSync(keyPath) && fs.existsSync(certPath)){
      https.createServer({
        key:fs.readFileSync(keyPath),
        cert:fs.readFileSync(certPath)
      },httpEvent).listen(config.https.port,hostname);
      httpsStarted=true;
    }
    else{
      console.log(`\n\x1b[33m⚠️ [HTTPS 警告] 无法启动 HTTPS 服务: 未找到证书文件!\x1b[0m`);
      console.log(`\x1b[33m   请检查: ${keyPath}\x1b[0m`);
    }
  }
  if(minifyConfig.type.length>0 || [1,2].includes(minifyConfig.buildJsCss)){
    watchSite.watch(config.root);
  }
  // === 控制台仪表盘 ===
  console.log("\n========================================================");
  console.log("🚀 local-site HTTP Server is running!");
  console.log("📦 Code link: https://github.com/baiyukey/local-site.git");
  console.log("========================================================\n");
  console.log("💡 [Parallel Output Engine Activated]");
  console.log(`   - IP/Localhost (Source)  -> ${config.root}`);
  console.log(`   - Custom Domain (Export) -> ${config.exportRoot}`);
  console.log(`   - Realtime Watcher: ${minifyConfig.realtime ? 'ON' : 'OFF'}\n`);
  console.log("🌐 Welcome Pages:");
  const startPage=(config.defaultPage && config.defaultPage.length>0) ? `/${config.defaultPage[0]}` : '/';
  console.log(`   - HTTP : http://${config.hostname}:${config.port}${startPage}`);
  if(httpsStarted){
    console.log(`   - HTTPS: https://${hostname}:${config.https.port}${startPage}`);
  }
  console.log("\nPress Ctrl+C to stop local-site.\n");
}

export default {run};
