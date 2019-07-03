# local-site<br>
创建一个本地web站点服务（create a new local Web site）
##### ★ NPM install 安装命令
npm i https://github.com/baiyukey/local-site.git<br>
或者：<br>
npm i local-site<br><br>
##### ★ 配置文件(lib/config.js):
let rootDir="../../root/";//即网站根目录地址 (该目录是相对于local-site根目录的地址)<br>
module.exports={<br>
  'hostname':'localhost',//主机名<br>
    'port':621,//http协议服务端口<br>
    'https':{//https相关配置<br>
    &nbsp;&nbsp;&nbsp;&nbsp;'enable':true,//是否开启https服务<br>
    &nbsp;&nbsp;&nbsp;&nbsp;'port':1978,//https协议服务端口号<br>
    &nbsp;&nbsp;&nbsp;&nbsp;'key':'./ssl/privatekey.pem',//https协议服务需要的私有证书<br>
    &nbsp;&nbsp;&nbsp;&nbsp;'cert':'./ssl/certificate.pem',//https协议服务需要的公有证书<br>
    },<br>
    'rootDir':rootDir,//根目录,用于存放js,css目录<br>
    'templateDir':rootDir+'template/',//根目录,用于存放html文件<br>
    'homePage':'/helloWord.html',//项目首页，存放于templateDir目录下，用于服务成功启动后的链接展示<br>
    'apiDir':'./api/',//后台程序,api接口目录<br>
    'apiProxy':'http:/\/10.10.10.88:8888'\, //Create an HTTP proxy server with an HTTP target<br>
    'uglifyJsCss':{<br>
    &nbsp;&nbsp;&nbsp;&nbsp;'enable':true,//是否开启代码压缩功能，默认true，即开启<br>
    &nbsp;&nbsp;&nbsp;&nbsp;'watchDir':rootDir+'media/user/',//监视目录，当js/,css/目录文件发生变化时自动压缩混淆到js.min/、css.min/目录<br>
    &nbsp;&nbsp;&nbsp;&nbsp;'babel':false,//是否将ES6规范以上的js代码转为ES5规范，默认false,即不转换<br>
    },<br>
    /\*'apiProxy':{//Create an HTTP proxy server with an HTTPS target<br>
     &nbsp;&nbsp;&nbsp;&nbsp;protocol: 'https:',<br>
     &nbsp;&nbsp;&nbsp;&nbsp;host: '10.10.10.88',<br>
     &nbsp;&nbsp;&nbsp;&nbsp;port: 8888,<br>
     &nbsp;&nbsp;&nbsp;&nbsp;pfx: fs.readFileSync('path/to/certificate.p12'),<br>
     &nbsp;&nbsp;&nbsp;&nbsp;passphrase: 'password',<br>
     },\*/<br>
    'apiLogShow':false<br>
  }<br><br>
##### ★ 实例方法启动web服务命令:
let service=require("local-site");<br>
service.run();<br>
##### ★ node启动local-site（local-site目录下）:
node service
##### ★ NPM启动local-site（node_modules/local-site目录下）:
npm run local-site
##### ★ local-site启动成功信息:
local-site is running!<br>
click this test link:<br>
http:/\/localhost:621/helloWorld.html<br>
https:/\/localhost:1978/helloWorld.html<br>
../../root/media/user/下的css/、js/目录已开启自动压缩混淆功能。（请确保您的计算机安装了java，处理css文档需要它。）<br>
press ctrl+c to stop local-site.<br>


