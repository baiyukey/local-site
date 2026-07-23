/**
 * Created by baiyu on 2016/1/14.
 * Updated to fix ESM require issue and deprecated APIs.
 */
import path from 'path';
import fs from "fs";
import httpProxy from 'http-proxy';
import config from "./config.js";
// 【关键修复】：在 ES Module 中主动创建 require 机制，防止动态引入私有 API 脚本时崩溃
import {createRequire} from 'module';

const require=createRequire(import.meta.url);
let apiProxy=httpProxy.createProxyServer({});
let apiCount=0;
let addProxy=function(req,res){
  // 使用现代 URL 解析
  const reqUrl=new URL(req.url,`http://${req.headers.host || 'localhost'}`);
  let moduleName=reqUrl.pathname;
  if(moduleName.indexOf(config.apiProxy.watchUrl)<0){
    // 不是代理接口请求，走本地 require
    // 替换废弃的 substr 为 slice
    moduleName=moduleName.slice(-1)==="/" ? ".."+moduleName.slice(0,-1)+"index" : ".."+moduleName;
    let requireBack=function(err){
      if(!err){
        console.log(path.join(config.apiDir,moduleName));
        // 这里现在可以安全使用 require 了
        let thisModule=require(moduleName);
        thisModule(req,res);
      }
      else{
        // 不存在的文件处理 (原样保留为空)
      }
    };
    // 替换废弃的 fs.exists 为 fs.access
    fs.access(path.join(config.apiDir,moduleName)+".js",fs.constants.F_OK,requireBack);
  }
  else{
    // 是 api 接口代理请求
    if(config.apiProxy.logShow){
      console.log("api请求("+(apiCount+=1)+")："+(typeof config.apiProxy.target==="string" ? config.apiProxy.target : config.apiProxy.target.protocol+"//"+config.apiProxy.target.host+":"+config.apiProxy.target.protocol)+moduleName);
    }
    apiProxy.web(req,res,{
      target:config.apiProxy.target
    });
    apiProxy.on("error",(err,req,res)=>{
      let errMessage=`ERROR: api连接失败或错误，请依次检查：1.网络连接，2.接口地址，3.接口参数。\n${typeof config.apiProxy.target==="string" ? config.apiProxy.target : config.apiProxy.target.protocol+"//"+config.apiProxy.target.host+":"+config.apiProxy.target.protocol}${req.url}`;
      res.writeHead(500,{
        'content-type':'text/plain;charset=utf-8'
      });
      console.log('\x1b[91m',errMessage,'\x1b[0m');
      res.write(errMessage);
      res.end();
    });
  }
};
export default addProxy;
