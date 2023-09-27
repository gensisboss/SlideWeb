//导入 express
const express = require('express')
const db = require('./index')

//创建路由
const router = express.Router();

//测试用例
router.get('/test',(req,res)=>{
    res.send("我是你爸爸");
})

//测试用例
router.get('/test2',(req,res)=>{
    res.send("我是你妈妈");
})

//获取用户信息
router.post('/search',(req,res)=>{
    const info = req.body;
    console.log("获取用户信息",info.nickname);
    //定义查询用户信息的SQL语句
    const sql = `select * from users where nickname=?`
    //调用db.query()执行sql语句
    db.query(sql,info.nickname,(error,result)=>{
        if(error) return  res.send({success: false,message: error.message});
        //执行sql语句成功，但是查询的结果为空
        if(result.length !== 1) return res.send({success: false,message: "查询结果为空"+message});
        //获取用户信息成功
        res.send({
            success: true,
            message: '获取用户信息成功',
            data : result[0]
        });
    })
 })

 //更新用户信息
router.post('/update',(req,res)=>{
    const info = req.body;
    console.log("更新用户信息",info);
    //定义查询用户信息的SQL语句
    const sql = `select * from users where nickname=?`
    //调用db.query()执行sql语句
    db.query(sql,info.nickname,(error,result)=>{
        if(error) return res.send({success: false,message: error.message});
        //执行sql语句成功，但是查询的结果为空
        if(result.length !== 1){
            //插入用户信息
            const insertSql =  `insert into users (nickname,level) values (?,?)`
            db.query(insertSql,[info.nickname,info.level],(error,results)=>{
                if(error) return res.send({success: false,message: error.message});
                if(results.affectedRows === 1) res.send({success: true,message: "更新用户信息成功"});
            })
        }else{
            //更新用户信息
            const updateSql =  `update users set level=? where nickname=?`
            db.query(updateSql,[info.level,info.nickname],(error,results)=>{
                if(error) return res.send({success: false,message: error.message});
                if(results.affectedRows === 1) res.send({success: true,message: "更新用户信息成功"});
            })
        }
       
    })
   
 })

 //删除用户信息
 router.post('/delete',(req,res)=>{
    const info = req.body;
    console.log("删除用户信息",info);

    //定义查询用户信息的SQL语句
    const sql = `delete from users where nickname=?`
    //调用db.query()执行sql语句
    db.query(sql,info.nickname,(error,results)=>{
        if(error) return res.send({success: false,message: error.message});
        if(results.affectedRows === 1)res.send({success: true,message: "删除用户信息成功"}); 
    })
 })

 //获取排行榜数据
 router.post('/rank',(req,res)=>{
    const info = req.body;
    const offset = parseInt(info.offset);
    const pagesize = parseInt(info.pagesize);
    console.log("获取排行版信息",info);
    const sql = `select *from users order by level desc limit ?,?`
    db.query(sql,[(offset-1)*pagesize,pagesize],(error,results)=>{
        if(error) return  res.send({success: false,message: error.message});
        //执行sql语句成功，但是查询的结果为空
        if(results.length == 0) return res.send({success: false,message: "查询结果为空".message,});
        //获取用户信息成功
        res.send({
            success: true,
            message: '获取排行榜信息成功',
            data : {array:results}
        });
    })
 })




module.exports = router;
