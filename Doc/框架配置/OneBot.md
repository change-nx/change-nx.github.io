# OneBot 
本框架使用基于napcat进行构造,请前往NapCat官网进行搭建[NapCat](https://napneko.github.io/guide/napcat)

## NapCat配置
搭建好NapCat并进行登录进入WebUI后

①
![①](Doc/框架配置/data/1.jpg)
②
![②](Doc/框架配置/data/2.jpg)
③
![③](Doc/框架配置/data/3.jpg)
④
![④](Doc/框架配置/data/4.jpg)

> 此时已配置完毕

## 框架配置
打开Adapter.json添加json

```json
{
    "id": "自定义",
    "QQ": 你机器人的QQ,
    "type": "OneBot",
    "token": "上报Token",
    "API": "http://127.0.0.1:3000",
    "APItoken": "HTTPtoken"
}
```

因框架下载完毕自带了一个Example插件,此时只需前往群聊发送"变量",如果机器有有回复则为搭建成功