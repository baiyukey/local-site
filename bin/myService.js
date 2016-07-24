/**
 * Created by baiyu on 2016/1/13.
 */
function run(){
  var http=require('http');
  var url=require('url');
  var path=require('path');
  var config=require('./config');
  var fs=require("fs");
  var mime=require("mime");
  var runRoute=require('./runRoute');
  var createCallback=function(req,res){
    var thisPath=config.hostDir+url.parse(req.url).pathname;
    var thisFile=path.basename(req.url);
    var thisMime=mime.lookup(path.basename(thisFile).slice(1));
    var fileCheck=function(has){
      if(has){
        var readCallback=function(err,file){
          if(!err){
            res.writeHead(200,{"Content-Type":thisMime});
            res.write(file);
            res.end();
          }
          else{
            res.writeHead(404,{"Content-Type":thisMime});
            res.end('<h1>404err</h1>');
          }
        };
        fs.readFile(thisPath,readCallback);
      }
      else{
        if(path.parse(req.url).dir.split("/")[1]==="api"){
          runRoute(req,res);
        }
        else{
          res.writeHead(404,"",{"Content-Type":mime.lookup("html")});
          res.write('<h1>404 ERR</h1>');
          res.end();
        }
      }
    };
    //console.log(thisPath);
    if(thisFile==="favicon.ico") return false;
    fs.exists(thisPath,fileCheck);
  };
  http.createServer(createCallback).listen(config.port,config.hostname);
  console.log("http://"+"localhost:"+config.port+" is open");
}
exports.run=run;