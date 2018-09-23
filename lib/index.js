/**
 * Created by baiyu on 2016/1/13.
 */
function run(){
  let http=require('http');
  let url=require('url');
  let path=require('path');
  let config=require('./config');
  let fs=require("fs");
  let mime=require("mime");
  let runRoute=require('./runRoute');
  let createCallback=function(req,res){
    let thisPath=config.templateDir+url.parse(req.url).pathname;
    if(url.parse(req.url).pathname.split("/")[1]==="media") thisPath=config.mediaDir+url.parse(req.url).pathname;
    //if(thisFile==="favicon.ico") return false;
    let fileCheck=function(has){
      if(has){
        let thisFile=path.basename(req.url);
        let thisMime=mime.lookup(path.extname(thisFile).replace(/[?#].+/,''));
        let readCallback=function(err,file){
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
    fs.exists(thisPath,fileCheck);
  };
  http.createServer(createCallback).listen(config.port,config.hostname);
  console.clear();
  console.log("NWS is open! \nclick this test link: \n"+"http://"+"localhost:"+config.port+"/helloWorld.html"+"\npress ctrl+c to stop local-site.");
}
exports.run=run;