/**
 * 纯粹的 API 代理转发模块
 */
import httpProxy from 'http-proxy';
import config from "./config.js";

let apiProxy=httpProxy.createProxyServer({});
let apiCount=0;
let addProxy=function(req,res){
  const reqUrl=new URL(req.url,`http://${req.headers.host || 'localhost'}`);
  let moduleName=reqUrl.pathname;
  if(config.apiProxy.logShow){
    const target=config.apiProxy.target;
    const targetStr=typeof target==="string" ? target : `${target.protocol}//${target.host}`;
    console.log(`api请求(${apiCount+=1})：${targetStr}${moduleName}`);
  }
  apiProxy.web(req,res,{
    target:config.apiProxy.target
  });
  apiProxy.on("error",(err,req,res)=>{
    const target=config.apiProxy.target;
    const targetStr=typeof target==="string" ? target : `${target.protocol}//${target.host}`;
    let errMessage=`ERROR: api连接失败或错误，请依次检查：1.网络连接，2.接口地址，3.接口参数。\n${targetStr}${req.url}`;
    res.writeHead(500,{
      'content-type':'text/plain;charset=utf-8'
    });
    console.log('\x1b[91m',errMessage,'\x1b[0m');
    res.write(errMessage);
    res.end();
  });
};
export default addProxy;
