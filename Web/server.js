//导入 express
const express = require('express')

//配置跨域中间件
const cors = require('cors')
//配置req数据解析中间件
const bodyParser = require('body-parser');
//导入用户信息的路由模块
const user = require('./user')

//创建 web 服务器
const app = express()
// 调用 app.listen(端口号，启动成功后的回调函数)，启动服务器
app.listen(3001,() => {console.log('启动服务器 slideweb')})
app.get('/',(req,res)=>{
    console.log("接受到消息");
    res.send("hello slide");
})


//使用cors
app.use(cors())
//配置解析表单数据中间件
app.use(express.urlencoded({extended:false}))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

//使用用户信息路由
app.use('/user',user)
