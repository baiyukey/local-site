# local-site<br>
创建一个本地web站点服务<br>
create a new local Web site<br>
##### NPM install 安装命令<br>
npm i local-site<br>
##### 配置文件:<br>
lib/config.js<br>
module.exports={<br>
  'hostname':'localhost',<br>
  'port':999,<br>
  //以下目录相对于启动web服务命令所在文件灵活调整<br>
  'mediaDir':'../local-site/test/webFile/',//根目录,用于存放js,css目录<br>
  'templateDir':'../local-site/test/webFile/html/',//根目录,用于存放html文件<br>
  'apiDir':'./api/'//(http://localhost:port/..)后台程序,api接口目录<br>
##### 启动web服务命令:<br>
let service=require("local-site");<br>
service.run();<br>
