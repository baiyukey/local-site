/**
 * Created by baiyu on 2016/1/14.
 */
var path=require('path');
var url=require("url");
var fs=require("fs");
var config=require("./config");
module.exports=function(req,res){
  console.log(url.parse(req.url).path.toString());
  var moduleName=url.parse(req.url).path;
  moduleName=moduleName.substr(-1)==="/" ?  moduleName.substr(0,moduleName.length-1)+"index" : moduleName;
  console.log(moduleName);
  moduleName='..'+moduleName;
  var requireBack=function(has){
    console.log(has);
    if(has){
      var thisModule=require(moduleName);
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