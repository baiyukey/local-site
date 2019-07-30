/**
 * Created by baiyu on 2016/1/13.
 */
function run(){
  let http=require('http');
  let https=require('https');
  let url=require('url');
  let path=require('path');
  let fs=require("fs");
  let mime=require("mime");
  let config=require('./config');
  let runRoute=require('./runRoute');
  let uglifyJsCss=require('./uglifyJsCss');
  let httpEvent=function(req,res){
    let thisPath=(config.rootDir+url.parse(req.url).pathname).replace(/\/\//g,"/");
    if(url.parse(req.url).pathname.replace(/.*\//,'').replace(/[?#].+/,'')==="") thisPath+="index.html";
    if(url.parse(req.url).pathname.split("/")[1]==="media") thisPath=config.objectDir+url.parse(req.url).pathname;
    //if(thisFile==="favicon.ico") return false;
    let fileCheck=function(has){
      if(has){
        let thisFile=thisPath.split("/").pop();
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
        if(["api",".."].indexOf(path.parse(req.url).dir.split("/")[1])>=0){//判断第网址一级目录是否存在于特殊字符集中
          runRoute(req,res);
        }
        else{
          res.writeHead(404,"",{"Content-Type":mime.lookup("html")});
          res.write('<h1>404 ERR</h1>');
          res.end();
        }
      }
    };
    fs.exists(thisPath,fileCheck);
  };
  http.createServer(httpEvent).listen(config.port,config.hostname);
  if(config.https.enable) https.createServer({
    key:fs.readFileSync(config.https.key),
    cert:fs.readFileSync(config.https.cert)
  },httpEvent).listen(config.https.port,config.hostname);
  if(config.uglifyJsCss.enable) uglifyJsCss.watch(config.uglifyJsCss.watchDir);//uglifyCssJs检测到目录中的文件发生改变时触发
  //  console.clear();
  console.log("\033[2J"+"local-site is running!"+" \nclick this test link: \n"+"http://"+config.hostname+":"+config.port+config.homePage+(config.https.enable ? ("\n"+"https://"+config.hostname+":"+config.https.port+config.homePage) : '')+(config.uglifyJsCss.enable ? "\n"+config.uglifyJsCss.watchDir+"下的css/、js/目录已开启自动压缩混淆功能。（请确保您的计算机安装了java，处理css文档需要它。）" : "")+"\npress ctrl+c to stop local-site.");
}
exports.run=run;