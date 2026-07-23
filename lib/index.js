/**
 * local-site HTTP Server
 * 支持通过 Host 请求头智能切换：源文件目录 vs 编译输出目录
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
  let writeFile=function(_path,_res,_mime){
    fs.readFile(_path,(err,file)=>{
      if(!err){
        _res.writeHead(200,{"Content-Type":_mime || 'application/octet-stream'});
        _res.write(file);
        _res.end();
      }
      else{
        returnError(_res,404);
      }
    });
  };
  let returnError=function(_res,_code){
    _res.writeHead(_code,"",{"Content-Type":"text/html"});
    _res.write(`<h1>${_code} ERR</h1>`);
    _res.end();
  };
  let checkResult=function(_path,_res,_mime,_currentBaseRoot){
    return (err)=>{
      if(!err){
        writeFile(_path,_res,_mime);
      }
      else{
        if(_path.indexOf(minifyConfig.htmlDir)<0){
          const fallbackPath=path.join(_currentBaseRoot,minifyConfig.htmlDir,_path.replace(_currentBaseRoot,'')).replace(/\\/g,'/');
          fs.access(fallbackPath,fs.constants.F_OK,(err2)=>{
            if(!err2) writeFile(fallbackPath,_res,_mime);
            else returnError(_res,404);
          });
        }
        else{
          returnError(_res,404);
        }
      }
    };
  };
  let httpEvent=function(req,res){
    let [thisPath,thisExt]=["",""];
    const reqUrl=new URL(req.url,`http://${req.headers.host}`);
    const hostName=reqUrl.hostname;
    const isIpRequest=/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostName) || hostName==='localhost' || hostName==='::1';
    const currentRoot=isIpRequest ? config.root : config.exportRoot;
    const currentBaseRoot=path.join(currentRoot,config.virtualRoot || '').replace(/\\/g,'/')+(config.virtualRoot ? '/' : '');
    thisPath=reqUrl.pathname;
    thisExt=thisPath.replace(/^.*[\/.]*\.(\w*)[?#]*.*$/,"$1");
    if(["htm","html"].includes(thisExt)){
      thisPath=currentBaseRoot+minifyConfig.htmlDir+thisPath;
    }
    else if(thisPath===thisExt){
      if(getSourceDir(thisPath)===getSourceDir(config.apiProxy.watchUrl)){
        addProxy(req,res);
        return false;
      }
      else{
        thisPath=currentBaseRoot+minifyConfig.htmlDir+thisPath+"index.html";
        thisExt="html";
      }
    }
    else{
      thisPath=currentBaseRoot+thisPath;
    }
    thisPath=thisPath.replace(/\/\//g,"/");
    fs.access(thisPath,fs.constants.F_OK,checkResult(thisPath,res,mime.getType(thisExt),currentBaseRoot));
  };
  // === 启动服务 ===
  http.createServer(httpEvent).listen(config.port,hostname);
  let httpsStarted=false;
  if(config.https.enable){
    const keyPath=path.resolve(config.https.key);
    const certPath=path.resolve(config.https.cert);
    // 安全检查：确认证书文件是否存在
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
  // === 全新美化的控制台仪表盘 ===
  // (去除 clear 避免吞掉前面的警告信息)
  console.log("\n========================================================");
  console.log("🚀 local-site HTTP Server is running!");
  console.log("📦 Code link: https://github.com/baiyukey/local-site.git");
  console.log("========================================================\n");
  console.log("💡 [Parallel Output Engine Activated]");
  console.log(`   - IP/Localhost (Source)  -> ${config.root}`);
  console.log(`   - Custom Domain (Export) -> ${config.exportRoot}`);
  console.log(`   - Realtime Watcher: ${minifyConfig.realtime ? 'ON' : 'OFF'}\n`);
  console.log("🌐 Welcome Pages:");
  console.log(`   - HTTP : http://${hostname}:${config.port}${config.homePage}`);
  // 只有 HTTPS 真正启动成功了，才打印地址
  if(httpsStarted){
    console.log(`   - HTTPS: https://${hostname}:${config.https.port}${config.homePage}`);
  }
  console.log("\nPress Ctrl+C to stop local-site.\n");
}

export default {run};
