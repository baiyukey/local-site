# local-site<br>
创建一个本地web站点服务（create a new local Web site）
##### ★ 安装 ( 注意！如果要升级local-site，请先备份local-site/lib/config.js文档。)
npm i https://github.com/baiyukey/local-site.git  (推荐)<br>
或者：<br>
npm i local-site<br>
安装完成后进入local-site目录执行：<br>
npm install<br><br>
##### ★ 配置文件(lib/config.js):<br>
let objectDir="./test/webFile/";//非根目录，仅是一个变量，为local-site模块的地址与网站项目的相对目录<br>
let rootDir=objectDir+"html/";//网站根目录，访问网址为“/”，必选项<br>
let flyDir=objectDir+"media/";//资源目录，可以不在根目录下，但是可以通过“/media/...”访问，可选项<br>
module.exports={<br>
  'hostname':'localhost',//主机名，为localhost或可用的IP地址<br>
    'port':621,//http协议服务端口<br>
    'https':{//https相关配置<br>
    &nbsp;&nbsp;&nbsp;&nbsp;'enable':true,//是否开启https服务<br>
    &nbsp;&nbsp;&nbsp;&nbsp;'port':1978,//https协议服务端口号<br>
    &nbsp;&nbsp;&nbsp;&nbsp;'key':'./ssl/privatekey.pem',//https协议服务需要的私有证书<br>
    &nbsp;&nbsp;&nbsp;&nbsp;'cert':'./ssl/certificate.pem',//https协议服务需要的公有证书<br>
    },<br>
    'objectDir':objectDir,<br>
    'rootDir':rootDir,<br>
    'flyDir':flyDir,<br>
    'homePage':'/i.html',//欢迎页，服务成功启动后的链接展示<br>
    'apiDir':'./api/',//local-site私有api目录。<br>
  'uglifyJsCss':{<br>
    &nbsp;&nbsp;&nbsp;&nbsp;'enable':true,//是否开启代码压缩功能，默认true，即开启<br>
    &nbsp;&nbsp;&nbsp;&nbsp;'watchDir':flyDir,//监视目录下的js/,css/目录文件发生变化时自动压缩混淆到js.min/、css.min/目录<br>
    &nbsp;&nbsp;&nbsp;&nbsp;'babel':false,//是否将ES6或更高规范的js代码转为ES5规范，默认false,即不转换<br>
  },<br>
  'elfFrame':{<br>
    &nbsp;&nbsp;&nbsp;&nbsp;'enable':false,//是否对elfFrame的支持,当为true时，在rootDir中创建html文件时会在flyDir下的js/、css/目录中创建对应的文件,默认false,即不支持,想了解elfFrame？点击：http://www.uiElf.com/elfFrame/<br>
    &nbsp;&nbsp;&nbsp;&nbsp;'watchDir':rootDir//服务监视目录<br>
  },<br>
    'apiProxy':'http:/\/10.10.10.88:8888'\, //Create an HTTP proxy server with an HTTP target<br>
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
http:/\/localhost:621/i.html<br>
https:/\/localhost:1978/i.html<br>
./test/webFile/media/下的css/、js/目录已开启自动压缩混淆功能。（请确保您的计算机安装了java，处理css文档需要它。）<br>
press ctrl+c to stop local-site.<br>


