# local-site<br>
创建一个本地web站点服务,可一键实现测试服务，代理服务，代码编译服务等功能。
##### ★ 安装 ( 注意！如果要升级local-site，请先备份local-site/lib/config.js文档。)
方法一，NPM方式 (推荐)：
```Bash
npm i local-site
```
方法二，github克隆方式 :<br>
```Bash
git clone https://github.com/baiyukey/local-site.git
```
   
##### ★ 启动local-site :
如果采用了NPM安装方式，local-site在node_modules下，<br>
如果采用了项目克隆安装方式，node_modules在local-site目录下,<br>
不论何种方式，都不影响程序运行启动，需要注意的是在不同的目录下命令稍有不同。<br>
local-site目录下执行
```Bash
node . -serve
```
或者node_modules目录下执行:
```Bash
node local-site -serve
```

##### ★ 实例方法启动web服务命令:
```javascript
let localSite=require("local-site");
localSite.run();
```

##### ★ local-site启动成功信息:
```Bash
local-site build success!
root:d:/www/local-site/test/webFile
code link:
https://github.com/baiyukey/local-site.git
localhost welcome page:
http://localhost:621/index.html
https://localhost:1978/index.html
d:/www/local-site/test/webFile/media下的css/、js/目录已开启自动编译功能。
d:/www/local-site/test/webFile/html下的html文件已激活文件自动关联JS,CSS的功能。
press ctrl+c to stop local-site.
```

##### ★ 启动minify命令:
在config.js中如果将uglifyJsCss置为了false,即不是实时对代码进行编码，可以在后期上线前统一编码，local-site目录下可用如下命令。
```Bash
npm run minify
```
或者，在node_modules目录下：
```Bash
node local-site -minify
```

也可以用实例方法执行：
```javascript
let minifyProject=require("local-site/lib/minifyProject.js");
minifyProject.run();
```

minify工具成功开启显示信息:
```Bash
local-site minify is ready...
code link: https://github.com/baiyukey/local-site.git
...
...
press ctrl+c to stop local-site.
```

##### ★ 配置文件(local-site/lib/config.js):<br>
```javascript
let root="d:/www/local-site/test/webFile/";//项目目录,访问网址为“/”，也是根目录
let virtualRoot=`${root}html/`;//虚拟根目录，访问网址为“/”，必选项
export default {
  'hostname':'localhost',//主机名，也可以设置成本机的IP地址，默认localhost
  'homePage':'/index.html',//欢迎页URL，服务成功启动后的链接展示
  'port':621,//http协议服务端口
  'https':{//https相关配置
    'enable':true,//是否开启https服务
    'port':1978,//https协议服务端口号
    'key':'./ssl/privatekey.pem',//https协议服务需要的私有证书
    'cert':'./ssl/certificate.pem'//https协议服务需要的公有证书
  },//https相关配置
  'root':root,//项目根目录
  'virtualRoot':virtualRoot,//虚拟根目录
  'htmlRoot':virtualRoot,//html根目录
  'apiDir':'./api/',//local-site私有api目录。
  'jsCss':{
    /**
     * @param {Boolean} [isUglify=true] -是否开启代码js,css文件的压缩功能，默认true，即开启
     * @param {Boolean} [isBabel=true] -是否将ES6或更高规范的js代码转为ES5规范，默认false,即不转换
     * @param {String} [extend=".min"] -编译输出的文件名追加字符，例如a.js编译后的文件名为a.min.js，如果不需要更改可以留空
     * @param {String} [sourceDir=root+"media/"] -监视目录，为源文件目录，当其中的js、css文件发生变化时自动编译
     * @param {String} [exportDir=root+"media/"] -编译存储目录，为编译后的文件存储目录，编译后的文件会以.min.(js|css)为结尾
     * 如果sourceDir!=targetDir时，那么两个目录下的子目录树保持一致 例如/media/js/a/index.js输出为/media2/js/a/index.min.js
     * 如果sourceDir===exportDir，即为同一目录时，那么该目录下的“js/”目录编译到"js.min/"目录中(没有“js/”目录忽略此步)，用以区分管理，CSS同理。例如/media/js/a/index.js输出为/media/js.min/a/index.min.js
     */
    'isUglify':true,
    'isBabel':true,
    'extend':'.min',
    'sourceDir':`${root}media/`,
    'exportDir':`${root}media/`
  },
  'html':{
    /**
     * @param {Number} [buildJsCss=[0(默认),1]]
     * -buildJsCss=0时，在jsCss.sourceDir目录下的js或css目录关联，例如“/a/b/index.html”对应的js文件为"/media/js/a/b/index.js"，css同理
     * -buildJsCss=1时，在html文件的同级的js或css目录中创建关联的js或css文件，例如/a/b/index.html对应的js文件为 /a/b/js/index.js，css同理
     * @param {String} [sourceDir=virtualRoot] -服务监视目录
     */
    'buildJsCss':0,
    'sourceDir':virtualRoot
  },
  apiProxy:{//代理服务嚣配置
    //当URL地址为此目录时会向代理服务器请求，例如访问http://localhost:621/api/login时相当于向http://8.8.8.8:8888/api/login请求数据
    // 如果接口为根目录，没有任何识别符，可以在接口地址前加"/.//"，watchUrl设置为："/.//"
    "watchUrl":"/api/",//当URL地址为此目录时会向代理服务器请求
    'target':'http://8.8.8.8:8888',//http目标服务嚣地址
    /*'target':':{//Create an HTTP proxy server with an HTTPS target
     protocol: 'https:',
     host: 'my-domain-name',
     port: 443,
     pfx: fs.readFileSync('path/to/certificate.p12'),
     passphrase: 'password',
     },*/
    'logShow':false//是否显示代理请求日志
  }
};
```

