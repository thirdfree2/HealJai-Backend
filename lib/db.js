let mysql = require('mysql');
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'heal_jai'
})

connection.connect((err) => {
    if(err){
        console.log('Error = ',err)
        return
    }
    console.log('MySQL connected');
})

module.exports = connection;