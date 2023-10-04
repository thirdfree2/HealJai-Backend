let mysql = require('mysql');
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'app_healchat'
})

connection.connect((err) => {
    if(err){
        console.log('Error = ',err)
        return
    }
    console.log('MySQL connected');
})

module.exports = connection;