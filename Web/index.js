//导入数据库
const mysql = require('mysql')

//链接数据库
const db = mysql.createPool({
    host:"8.141.90.170",
    user:"root",
    password:"123456",
    database:"slide"
})

module.exports = db;