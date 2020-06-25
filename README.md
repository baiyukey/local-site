# local-site<br>
创建一个本地web站点服务,可一键实现测试服务，代理服务，代码压缩丑化服务等功能。
##### ★ 安装 ( 注意！如果要升级local-site，请先备份local-site/lib/config.js文档。)
方法一，NPM方式 (推荐)：<br>
   npm i local-site<br>
方法二，github克隆方式 :<br>
   git clone https://github.com/baiyukey/local-site.git<br>
   
##### ★ 启动local-site :
如果采用了NPM安装方式，local-site在node_modules下，<br>
如果采用了项目克隆安装方式，node_modules在local-site目录下,<br>
不论何种方式，都不影响程序运行启动，需要注意的是在不同的目录下命令稍有不同。<br>
  npm run service  (local-site目录下)<br>
或者<br>
  node . -service  (local-site目录下)<br>
或者<br>
  node local-site -service (node_modules目录下)<br>

##### ★ 实例方法启动web服务命令:
let localSite=require("local-site");<br>
localSite.run();<br>

##### ★ local-site启动成功信息:
local-site build success!<br>
code link<br>
https://github.com/baiyukey/local-site.git<br>
...welcome page:<br>
http:/\/localhost:621/i.html<br>
https:/\/localhost:1978/i.html<br>
...
...
press ctrl+c to stop local-site.<br><br>

##### ★ 启动minify命令:
在config.js中如果将uglifyJsCss置为了false,即不是实时对代码进行编码，可以在后期上线前统一编码，可用如下命令。<br>
npm run minify  (local-site目录下)<br>
或者：<br>
node local-site -minify  (node_modules目录下)<br>
也可以用实例方法执行：<br>
let minifyProject=require("local-site/lib/minifyProject.js");<br>
minifyProject.run();<br>
<br>
minify工具成功开启显示信息:
local-site minify is ready...<br>
code link<br>
https://github.com/baiyukey/local-site.git<br>
...
...
press ctrl+c to stop local-site.<br>

##### ★ 配置文件(local-site/lib/config.js):<br>
let root="D:/www/local-site/test/webFile/";//项目目录,访问网址为“/”，即根目录，必选项<br>
let virtualRoot=root+"html/";//虚拟根目录，访问网址为“/”，必选项<br>
module.exports={<br>
&nbsp;'hostname':'localhost',//主机名，也可以设置成本机的IP地址，默认localhost<br>
&nbsp;'homePage':'/i.html',//欢迎页URL，服务成功启动后的链接展示<br>
&nbsp;'port':621,//http协议服务端口<br>
&nbsp;'https':{//https相关配置<br>
&nbsp;&nbsp;'enable':true,//是否开启https服务<br>
&nbsp;&nbsp;'port':1978,//https协议服务端口号<br>
&nbsp;&nbsp;'key':'./ssl/privatekey.pem',//https协议服务需要的私有证书<br>
&nbsp;&nbsp;'cert':'./ssl/certificate.pem'//https协议服务需要的公有证书<br>
&nbsp;},//https相关配置<br>
&nbsp;'root':root,//项目根目录<br>
&nbsp;'virtualRoot':virtualRoot,//虚拟根目录<br>
&nbsp;'htmlRoot':virtualRoot,//html根目录<br>
&nbsp;'filesRoot':root,//文件资源根目录<br>
&nbsp;'apiDir':'./api/',//local-site私有api目录。<br>
&nbsp;'uglifyJsCss':{<br>
&nbsp;&nbsp;'enable':true,//是否开启代码js,css文件的压缩功能，默认true，即开启<br>
&nbsp;&nbsp;'watchDir':root+"media/",//监视目录下的js/,css/目录文件发生变化时自动压缩混淆到js.min/、css.min/目录<br>
&nbsp;&nbsp;'babel':true//是否将ES6或更高规范的js代码转为ES5规范，默认false,即不转换<br>
&nbsp;},<br>
&nbsp;'elfFrame':{<br>
&nbsp;&nbsp;'enable':false,//是否对elfFrame的支持,当为true时，在watchDir中创建html文件时会在uglifyJsCss.watchDir下的js/、css/目录中创建对应的文件,默认false,即不支持,想了解elfFrame？点击：http://www.uiElf.com/elfFrame/<br>
&nbsp;&nbsp;'watchDir':virtualRoot//服务监视目录<br>
&nbsp;},<br>
&nbsp;apiProxy:{//代理服务嚣配置，例如访问http://localhost:621/api/login时相当于向http://8.8.8.8:8888/api/login请求数据<br>
&nbsp;&nbsp;"watchUrl":"/api/",//当URL地址为此目录时会向代理服务器请求<br>
&nbsp;&nbsp;'target':'http://8.8.8.8:8888',//http目标服务嚣地址<br>
&nbsp;&nbsp;/*'target':':{//Create an HTTP proxy server with an HTTPS target<br>
&nbsp;&nbsp;protocol: 'https:',<br>
&nbsp;&nbsp;host: 'my-domain-name',<br>
&nbsp;&nbsp;port: 443,<br>
&nbsp;&nbsp;pfx: fs.readFileSync('path/to/certificate.p12'),<br>
&nbsp;&nbsp;passphrase: 'password',<br>
&nbsp;},*/<br>
&nbsp;'logShow':false//是否显示代理请求日志<br>
&nbsp;}<br>
};<br><br>


