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
  let watchSite=require('./watchSite');
  let hostname=config.hostname;
  let dir=fs.existsSync(config.root) ? "" : './local-site/';
  let httpEvent=function(req,res){
    let thisPath=(config.htmlRoot+url.parse(req.url).pathname).replace(/\/\//g,"/");
    if(url.parse(req.url).pathname.replace(/.*\//,'').replace(/[?#].+/,'')==="") thisPath+="index.html";
    if(["htm","html"].indexOf(thisPath.replace(/^(.*\/.*\.)(.*)$/,"$2"))<0) thisPath=config.filesRoot+url.parse(req.url).pathname;
    //if(thisFile==="favicon.ico") return false;
    let fileCheck=function(has){
      if(has){
        let thisFile=thisPath.split("/").pop();
        let thisMime=mime.getType(path.extname(thisFile).replace(/[?#].+/,''));
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
          res.writeHead(404,"",{"Content-Type":mime.getType("html")});
          res.write('<h1>404 ERR</h1>');
          res.end();
        }
      }
    };
    fs.exists(thisPath,fileCheck);
  };
  http.createServer(httpEvent).listen(config.port,hostname);
  if(config.https.enable) https.createServer({
    key:fs.readFileSync(dir+config.https.key),
    cert:fs.readFileSync(dir+config.https.cert)
  },httpEvent).listen(config.https.port,hostname);
  //if(config.watchObject.enable) watchObject.watch(config.watchObject.watchDir);//uglifyCssJs检测到目录中的文件发生改变时触发
  if(config.uglifyJsCss.enable||config.elfFrame.enable) watchSite.watch(dir+config.root);//uglifyCssJs检测到目录中的文件发生改变时触发
  //  console.clear();
  console.log("\\033[2J"+"local-site build success!"+" \ncode link:\nhttps://github.com/baiyukey/local-site.git\n"+config.hostname+" welcome page: \n"+"http://"+hostname+":"+config.port+config.homePage+(config.https.enable ? ("\n"+"https://"+hostname+":"+config.https.port+config.homePage) : '')+(config.uglifyJsCss.enable ? "\n"+config.uglifyJsCss.watchDir+"下的css/、js/目录已开启自动压缩混淆功能（处理css文档需要安装JAVA，如已安装请忽略。https://www.java.com/）。" : "")+(config.elfFrame.enable ? "\n"+dir+config.elfFrame.watchDir+"下的html文件已激活同步创建elfFrame框架关联文件的功能。" : "")+"\npress ctrl+c to stop local-site.");
}
exports.run=run;