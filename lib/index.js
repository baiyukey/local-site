/**
 * Created by baiyu on 2016/1/13.
 */
import http from "http";
import https from "https";
import url from "url";
import path from "path";
import fs from "fs";
import mime from "mime";
import config from "./config.js";
import watchSite from "./watchSite.js";

function run(){
  config.jsCss.sourceDir=path.resolve(config.jsCss.sourceDir).replace(/\\/g,'/');
  config.html.sourceDir=path.resolve(config.html.sourceDir).replace(/\\/g,'/');
  config.root=path.resolve(config.root).replace(/\\/g,'/');
  let hostname=config.hostname;
  let getSourceDir=(_v)=>_v.replace(/[/]*([a-zA-Z0-9]*)\/.*/,"$1");//获取根目录
  let writeFile=function(_path,_res,_mime){
    fs.readFile(_path,(err,file)=>{
      if(!err){
        _res.writeHead(200,{"Content-Type":_mime});
        _res.write(file);
        _res.end();
      }
      else{
        returnError(_res,_mime,404);
      }
    });
  };
  let returnError=function(_res,_mime,_code){
    _res.writeHead(_code,"",{"Content-Type":_mime});
    _res.write(`<h1>${_code} ERR</h1>`);
    _res.end();
  };
  let checkResult=function(_path,_res,_mime){
    return (has)=>{
      if(has){
        writeFile(_path,_res,_mime);
      }
      else{
        //如果文件不存在，再次在html目录下查找
        if(_path.indexOf(config.htmlRoot)<0){
          _path=_path.replace(config.root,config.htmlRoot);
          fs.exists(_path,checkResult(_path,_res,_mime));
        }
        else{
          returnError(_res,_mime,404);
        }
      }
    };
  };
  let httpEvent=function(req,res){
    let [thisPath,thisExt]=["",""];
    thisPath=url.parse(req.url).pathname;
    thisExt=thisPath.replace(/^.*\/.*\.(\w*)[?#]*.*$/,"$1");//url.parse(req.url).ext无法获取错误路径的扩展名
    if(["htm","html"].indexOf(thisExt)>=0){
      thisPath=config.htmlRoot+thisPath;
    }
    else if(thisPath===thisExt){//没有扩展名的情况
      if(getSourceDir(thisPath)===getSourceDir(config.apiProxy.watchUrl)){//判断网址根目录是否是api目录
        addProxy(req,res);
        return false;
      }
      else{
        //没有扩展名,例如www.abc.com/abc/，在路径下指定默认文件index.html,（不严谨，复杂情况不再处理）
        thisPath=config.htmlRoot+thisPath+"index.html";
        thisExt="html";
      }
    }
    else{//其它扩展名，例如js,css,jpg,svg等
      //优先非html目录下查找，后面如果查不到会再次在html目录中查找
      thisPath=config.root+thisPath;
    }
    thisPath=thisPath.replace(/\/\//g,"/");
    //if(thisFile==="favicon.ico") return false;
    fs.exists(thisPath,checkResult(thisPath,res,mime.getType(thisExt)));
  };
  http.createServer(httpEvent).listen(config.port,hostname);
  if(config.https.enable) https.createServer({
    key:fs.readFileSync(config.https.key),
    cert:fs.readFileSync(config.https.cert)
  },httpEvent).listen(config.https.port,hostname);
  if(config.jsCss.isUglify || [0,1].includes(config.html.buildJsCss)) watchSite.watch(config.root);//isUglifyCssJs检测到目录中的文件发生改变时触发
  console.log("local-site build success!"+"\nroot:"+config.root+" \ncode link:\nhttps://github.com/baiyukey/local-site.git\n"+config.hostname+" welcome page: \n"+"http://"+hostname+":"+config.port+config.homePage+(config.https.enable ? ("\n"+"https://"+hostname+":"+config.https.port+config.homePage) : '')+(config.jsCss.isUglify ? "\n"+config.jsCss.sourceDir+"下的css/、js/目录已开启自动编译功能。" : "")+([0,1].includes(config.html.buildJsCss) ? "\n"+config.html.sourceDir+"下的html文件已激活文件自动关联JS,CSS的功能。" : "")+"\npress ctrl+c to stop local-site.\n");
}

export default {run};
