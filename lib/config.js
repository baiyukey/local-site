/**
 * Created by baiyu on 2016/1/13.
 */
let root="d:/www/local-site/test/webFile/";//项目目录,访问网址为“/”，也是根目录
let virtualRoot=root+"html/";//虚拟根目录，访问网址为“/”，必选项
module.exports={
  'hostname':'localhost',//主机名，也可以设置成本机的IP地址，默认localhost
  'homePage':'/i.html',//欢迎页URL，服务成功启动后的链接展示
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
  'filesRoot':root,//文件资源根目录
  'apiDir':'./api/',//local-site私有api目录。
  'uglifyJsCss':{
    'enable':true,//是否开启代码js,css文件的压缩功能，默认true，即开启
    'watchDir':root+"media/",//监视目录下的js/,css/目录文件发生变化时自动压缩混淆到js.min/、css.min/目录
    'babel':true//是否将ES6或更高规范的js代码转为ES5规范，默认false,即不转换
  },
  'elfFrame':{
    'enable':true,//是否对elfFrame的支持,当为true时，在watchDir中创建html文件时会在uglifyJsCss.watchDir下的js/、css/目录中创建对应的文件,默认false,即不支持,想了解elfFrame？点击：http://www.uiElf.com/elfFrame/
    'watchDir':virtualRoot//服务监视目录
  },
  apiProxy:{//代理服务嚣配置，例如访问http://localhost:621/api/login时相当于向http://8.8.8.8:8888/api/login请求数据
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