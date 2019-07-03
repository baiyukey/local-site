/**
 * Created by baiyu on 2016/1/13.
 */
let rootDir="./test/webFile/";//即网站根目录地址 (该目录是相对于local-site根目录的地址)
module.exports={
  'hostname':'localhost',//主机名
  'port':621,//http协议服务端口
  'https':{//https相关配置
    'enable':true,//是否开启https服务
    'port':1978,//https协议服务端口号
    'key':'./ssl/privatekey.pem',//https协议服务需要的私有证书
    'cert':'./ssl/certificate.pem',//https协议服务需要的公有证书
  },//https相关配置
  'rootDir':rootDir,//根目录,用于存放js,css目录
  'templateDir':rootDir+'html/',//html文件根目录,用于存放html文件
  'homePage':'/helloWorld.html',//项目首页，存放于templateDir目录下，用于服务成功启动后的链接展示
  'apiDir':'./api/',//后台程序,api接口目录
  'apiProxy':'http://10.10.10.88:8888',//Create an HTTP proxy server with an HTTP target
  'uglifyJsCss':{
    'enable':true,//是否开启代码压缩功能，默认true，即开启
    'watchDir':rootDir+'media/',//当监视目录下的js/,css/目录文件发生变化时自动压缩混淆到js.min/、css.min/目录
    'babel':false,//是否将ES6规范以上的js代码转为ES5规范，默认false,即不转换
  },
  /*'apiProxy':{//Create an HTTP proxy server with an HTTPS target
   protocol: 'https:',
   host: 'my-domain-name',
   port: 443,
   pfx: fs.readFileSync('path/to/certificate.p12'),
   passphrase: 'password',
   },*/
  'apiLogShow':false
};