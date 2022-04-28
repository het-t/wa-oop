var {client,Message,ask} = require('./main.js');
var {job} = require('cron')
var {getProgressData,createReport,u} = require('./rec.js')
var fs = require('fs');
const path = require('path');

client.on('message',(msg)=>{
    var msgObj = new Message(msg);
})

var shceduleSending = new job('00 25 23 * * * ',()=>{
    try {
        u.then(async (userIdArray)=>{
            await userIdArray.forEach((uidObj)=>{
                getProgressData(uidObj.user).then((obj)=>{
                    createReport(obj.res,obj.uid)
                })
            })
        })
    }
    finally{
        sendPdf()
    }
    
})

var sendPdf =  async () => {

    var f = []
    var files = fs.readdirSync(__dirname) 
    var listOfPdf = files.filter(file => {
        if (path.extname(file).toLowerCase() === '.pdf') {
            var fileUser = file.replace('c','c.').substring(0, 17);

            var fileDetails = {
                fileName:file,
                user:fileUser
            }
            console.log(fileDetails)
            f.push(fileDetails) 
        }
        
    });
    f.forEach((pdfelem)=>{
        try {
            var media = MessageMedia.fromFilePath(pdfelem.fileName)
        }
        finally {

            client.sendMessage(pdfelem.user,media)
        }
    })
} 

client.initialize().then(()=>{
    ask.start()
    shceduleSending.start();
})
