/**
 * Created by baiyu on 2016/1/14.
 */
let path=require('path');
let url=require("url");
let fs=require("fs");
let config=require("./config");
let httpProxy=require('http-proxy');
let apiProxy=httpProxy["createProxyServer"]({});
let apiCount=0;//api请求次数统计
module.exports=function(req,res){
  //console.log(url.parse(req.url).path.toString());
  let moduleName=url.parse(req.url).path;
  if(moduleName.indexOf(config.apiProxy.watchUrl)<0){//不是api接口请求
    moduleName=moduleName.substr(-1)==="/" ? ".."+moduleName.substr(0,moduleName.length-1)+"index" : ".."+moduleName;
    let requireBack=function(has){
      if(has){
        console.log(path.join(config.apiDir,moduleName));
        let thisModule=require(moduleName);
        thisModule(req,res);
      }
      else{
        //不存在的文件
      }
    };
    fs.exists(path.join(config.apiDir,moduleName)+".js",requireBack);
  }
  else{//是api接口
    if(config.apiProxy.logShow) console.log("api请求("+(apiCount+=1)+")："+(typeof config.apiProxy.target==="string" ? config.apiProxy.target : config.apiProxy.target.protocol+"//"+config.apiProxy.target.host+":"+config.apiProxy.target.protocol)+moduleName);
    apiProxy.web(req,res,{
      target:config.apiProxy.target
    });
  }
};