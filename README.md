# local-site
create a new local Web site<br>
##### 启动web服务命令:
let service=require("local-site");<br>
service.run();
##### 配置文件:
lib/config.js<br>
module.exports={<br>
  'hostname':'localhost',<br>
  'port':999,<br>
  'templateDir':'D:/www/NPM/node_modules/local-site/test/webFile/html/',//(http://localhost:port/..)html目录<br>
  'mediaDir':'D:/www/NPM/node_modules/local-site/test/webFile/',//(http://localhost:port/media/..)js,css目录<br>
  'apiDir':'D:/www/NPM/node_modules/local-site/api/'//(http://localhost:port/..)后台程序,api接口目录<br>
};