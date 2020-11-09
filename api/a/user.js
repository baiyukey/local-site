/**
 * Created by baiyu on 2016/1/14.
 */
import url from "url"
let testData=[
  {'name':'白宇','birthday':'1978-06-21','sex':'男'},
  {'name':'小明','birthday':'2012-01-27','sex':'男'},
  {'name':'孙悟空','birthday':'1516-08-08','sex':'男'},
  {'name':'花仙子','birthday':'1980-01-01','sex':'女'}
];
export default  function(req,res){
  let receiveData={};
  //console.log(req.method);
  if(req.method==="POST"){
    receiveData=req.form;
  }
  else if(req.method==="GET"){
    receiveData=url.parse(req.url);
  }
  res.write(JSON.stringify(receiveData));
  res.end();
};
