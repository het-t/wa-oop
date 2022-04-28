var mysql = require('mysql2');

var connection = mysql.createConnection({
    host:'localhost',
    user:'het',
    password:'het161967',
    database:'db2'
})

connection.connect((err)=>{
    if (err) console.log(err)
    else console.log("db connected")
});

var listTask = (user) => {
    
    return new Promise ((resolve,reject)=>{
        connection.query(`CALL list_task(?)`,[user],(err,results,fields)=>{
            if (err) {
                console.log(err)
                reject ()
            }
            else {
                results = results[0]
                resolve(results);
            }
        })
    })
}

var progress = (uid,task,progress) => {
    connection.query(`CALL progress(?,?,?)`,[uid,task,progress],(err)=>{                   
        if (err){
            console.log(err)
        }
    })
}

var removeTask = (uid,task) => {
    connection.query(`CALL remove_task(?,?)`,[uid,task],(err)=>{
                  
        if (err){
            console.log(err)
        }
    })
}

var Qwatcher = (Q)=>{
    Q.forEach((Qobj,index) => {
        if (Qobj.rating != '' && Qobj.action == 'set progress') {
            progress(Qobj.sender,Qobj.taskInfo,Qobj.rating);
            Q.splice(index,1);
        }
        else if (Qobj.aciton == 'delete task' && Qobj.taskInfo != '') {
            removeTask(Qobj.sender,Qobj.taskInfo);
            Q.splice(index,1);
        }
    });
    
}

module.exports = {
    db_list_task    : listTask,
    Qwatcher        : Qwatcher,
    connection      : connection
};