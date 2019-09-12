# local-site<br>
创建一个本地web站点服务（create a new local Web site）
##### ★ 安装 ( 注意！如果要升级local-site，请先备份local-site/lib/config.js文档。)
npm i https://github.com/baiyukey/local-site.git  (推荐,持续更新中)<br>
或者：<br>
npm i local-site<br>
安装完成后进入local-site目录执行：<br>
npm install<br><br>
##### ★ 配置文件(lib/config.js):<br>
let objectDir="./test/webFile/";//非根目录，仅是一个变量，为local-site模块的地址与网站项目的相对目录<br>
let root="./test/webFile/";//项目目录,访问网址为“/”，也是根目录<br>
let virtualRoot=root+"html/";//虚拟根目录，访问网址为“/”，必选项<br>
module.exports={<br>
  'hostname':'localhost',//主机名，也可以设置成本机的IP地址，默认localhost<br>
  'homePage':'/i.html',//欢迎页URL，服务成功启动后的链接展示<br>
  'port':621,//http协议服务端口<br>
  'https':{//https相关配置<br>
    'enable':true,//是否开启https服务<br>
    'port':1978,//https协议服务端口号<br>
    'key':'./ssl/privatekey.pem',//https协议服务需要的私有证书<br>
    'cert':'./ssl/certificate.pem'//https协议服务需要的公有证书<br>
  },//https相关配置<br>
  'root':root,//项目根目录<br>
  'virtualRoot':virtualRoot,//虚拟根目录<br>
  'htmlRoot':virtualRoot,//html根目录<br>
  'filesRoot':root,//文件资源根目录<br>
  'apiDir':'./api/',//local-site私有api目录。<br>
  'uglifyJsCss':{<br>
    'enable':true,//是否开启代码js,css文件的压缩功能，默认true，即开启<br>
    'watchDir':root+"media/",//监视目录下的js/,css/目录文件发生变化时自动压缩混淆到js.min/、css.min/目录<br>
    'babel':true//是否将ES6或更高规范的js代码转为ES5规范，默认false,即不转换<br>
  },<br>
  'elfFrame':{//暂未开放<br>
    'enable':false,//是否对elfFrame的支持,当为true时，在watchDir中创建html文件时会在uglifyJsCss.watchDir下的js/、css/目录中创建对应的文件,默认false,即不支持,想了解elfFrame？点击：http://www.uiElf.com/elfFrame/<br>
    'watchDir':virtualRoot//服务监视目录<br>
  },<br>
  apiProxy:{//代理服务嚣配置，例如访问http://localhost:621/api/login时相当于向http://8.8.8.8:8888/api/login请求数据<br>
    "watchUrl":"/api/",//当URL地址为此目录时会向代理服务器请求<br>
    'target':'http://8.8.8.8:8888',//http目标服务嚣地址<br>
    /*'target':':{//Create an HTTP proxy server with an HTTPS target<br>
     protocol: 'https:',<br>
     host: 'my-domain-name',<br>
     port: 443,<br>
     pfx: fs.readFileSync('path/to/certificate.p12'),<br>
     passphrase: 'password',<br>
     },*/<br>
    'logShow':false//是否显示代理请求日志<br>
  }<br>
};<br><br>
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


