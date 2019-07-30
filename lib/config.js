/**
 * Created by baiyu on 2016/1/13.
 */
let objectDir="./test/webFile/";//非根目录，仅是一个变量，为local-site模块的地址与网站项目的相对目录
let rootDir=objectDir+"html/";//网站根目录，访问网址为“/”，必选项
let flyDir=objectDir+"media/";//资源目录，可以不在根目录下，但是可以通过“/media/...”访问，可选项
module.exports={
  'hostname':'localhost',//主机名，为localhost或可用的IP地址
  'port':621,//http协议服务端口
  'https':{//https相关配置
    'enable':true,//是否开启https服务
    'port':1978,//https协议服务端口号
    'key':'./ssl/privatekey.pem',//https协议服务需要的私有证书
    'cert':'./ssl/certificate.pem',//https协议服务需要的公有证书
  },//https相关配置
  'objectDir':objectDir,
  'rootDir':rootDir,
  'flyDir':flyDir,
  'homePage':'/i.html',//项目首页，服务成功启动后的链接展示
  'apiDir':'./api/',//local-site私有api目录。
  'uglifyJsCss':{
    'enable':true,//是否开启代码压缩功能，默认true，即开启
    'watchDir':flyDir,//监视目录下的js/,css/目录文件发生变化时自动压缩混淆到js.min/、css.min/目录
    'babel':false,//是否将ES6或更高规范的js代码转为ES5规范，默认false,即不转换
  },
  'elfFrame':{//暂未开放
    'enable':false,//是否对elfFrame的支持,当为true时，在rootDir中创建html文件时会在flyDir下的js/、css/目录中创建对应的文件,默认false,即不支持,想了解elfFrame？点击：http://www.uiElf.com/elfFrame/
    'watchDir':rootDir//服务监视目录
  },
  'apiProxy':'http://10.10.10.88:8888',//Create an HTTP proxy server with an HTTP target
  /*'apiProxy':{//Create an HTTP proxy server with an HTTPS target
    protocol: 'https:',
    host: 'my-domain-name',
    port: 443,
    pfx: fs.readFileSync('path/to/certificate.p12'),
    passphrase: 'password',
   },*/
  'apiLogShow':false
};