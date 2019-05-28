/**
 * Created by baiyu on 2016/1/13.
 */
module.exports={
  'hostname':'localhost',
  'port':999,
  'mediaDir':'../../qssystem/',//根目录,用于存放js,css目录
  'templateDir':'../../qssystem/template/',//根目录,用于存放html文件
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