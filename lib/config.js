/**
 * Created by baiyu on 2016/1/13.
 */
module.exports={
  'hostname':'localhost',//主机名
  'port':999,//http协议服务端口
  'https':{//https相关配置
    'enable':true,//是否开启https服务
    'port':9999,//https协议服务端口号
    'key':'./ssl/privatekey.pem',//https协议服务需要的私有证书
    'cert':'./ssl/certificate.pem',//https协议服务需要的公有证书
  },//https相关配置
  'mediaDir':'./test/webFile/media/',//根目录,用于存放js,css目录
  'templateDir':'./test/webFile/html/',//根目录,用于存放html文件
  'apiDir':'./api/',//后台程序,api接口目录
  'apiTarget':'http://10.10.10.34:8888',//Create an HTTP proxy server with an HTTP target
  /*'apiTarget':{//Create an HTTP proxy server with an HTTPS target
   protocol: 'https:',
   host: 'my-domain-name',
   port: 443,
   pfx: fs.readFileSync('path/to/certificate.p12'),
   passphrase: 'password',
   },*/
  'apiLogShow':false
};