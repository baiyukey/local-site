# local-site
创建一个本地web站点服务<br>
create a new local Web site<br>
##### NPM install 安装命令
npm i --save local-site@latest<br>
##### 配置文件:
lib/config.js<br>
module.exports={<br>
  'hostname':'localhost',<br>
  'port':999,<br>
  //以下目录相对于启动web服务命令所在文件灵活调整
  'templateDir':'./test/webFile/html/',//(http://localhost:port/..)html目录<br>
  'mediaDir':'./test/webFile/',//(http://localhost:port/media/..)js,css目录<br>
  'apiDir':'./api/'//(http://localhost:port/..)后台程序,api接口目录<br>
};<br>
##### 启动web服务命令:
let service=require("local-site");<br>
service.run();
