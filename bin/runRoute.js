/**
 * Created by baiyu on 2016/1/14.
 */
let path=require('path');
let url=require("url");
let fs=require("fs");
let config=require("./config");
module.exports=function(req,res){
  console.log(url.parse(req.url).path.toString());
  let moduleName=url.parse(req.url).path;
  moduleName=moduleName.substr(-1)==="/" ?  moduleName.substr(0,moduleName.length-1)+"index" : moduleName;
  console.log(moduleName);
  moduleName='..'+moduleName;
  let requireBack=function(has){
    console.log(has);
    if(has){
      let thisModule=require(moduleName);
      thisModule(req,res);
    }
    else{
      res.writeHeader(500,{"Content-Type":"text/html"});
      res.write('<h1>500 ERR</h1>');
      res.end();
    }
  };
  console.log(path.join(config.apiDir,moduleName));
  fs.exists(path.join(config.apiDir,moduleName)+".js",requireBack);
};