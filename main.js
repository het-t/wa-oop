var {Client, Buttons, List} = require('whatsapp-web.js');
var {db_list_task,Qwatcher,connection} = require('./db.js')
var qrcode = require('qrcode-terminal');
var {job} = require('cron')

var btn = new Buttons(' ',[
    {
        id:'prg',
        body:'set progress'    
    },{
        id:'rmt',
        body:'delete task'
    }],'menu','')

var ratingList = `[{"title":"Rating","rows":[{"rowId":"1","title":"1","description":""},{"rowId":"2","title":"2","description":""},{"rowId":"3","title":"3","description":""},{"rowId":"4","title":"4","description":""},{"rowId":"5","title":"5","description":""}]}]`
ratingList = JSON.parse(ratingList)
ratingList = new List('set progress','rating',ratingList,'','')
    

var listJSON1 = `[{"title":"List Of Task","rows":[`;
var listJSON3 = ']}]';

var addToQ = (obj) => {
    delete obj?.msgType;
    delete obj?.listType;
    actionQ.push(obj);
}

var showList = async (user, client, flag) => {
    var listJSON2 = '';
    
    var listData = new Array();
    listData = await db_list_task(user)
    
    new Promise ((resolve,reject)=>{
            if (listData != ''){    
                listData.forEach(obj => {
                    if (listJSON2 !== '') {listJSON2+=','}
                    var taskID = obj.taskID;
                    var taskDesc = obj.description;
                    listJSON2+=`{"rowId":"${taskID}","title":"${taskDesc}","description":""}`;
                })
                resolve(listJSON1+listJSON2+listJSON3);
            }
            else {
                reject()
            }
        })

    .then((list)=>{
        list = JSON.parse(list)
        var l = new List(flag,'list of task',list,'','')
        client.sendMessage(user,l)
    },()=>{
        client.sendMessage(user,'invalid operation \nyou don\'t have any task \nfirst add new task')
    })
    .catch ((err)=>{
        console.log(err)
    });
}

class Message {

    constructor(msg) {
        this.msg = msg.body,
        this.msgType = msg.type,
        this.sender = msg.from

        switch (this.msgType) {
            case 'chat' :
                this.sendResToChat();
                break;
            case 'list_response' :
                this.listType = msg?._data?.quotedMsg?.list?.buttonText;
                this.taskInfo = msg?.body;
                this.action = msg?._data?.quotedMsg?.list?.description;
                delete this.msg;
                var Qobj = new ListRes(this);
                break;
            case 'buttons_response' :
                showList(this.sender, client, this.msg)
                break;
        }
    }

    sendResToChat () {
        console.log('sendRes-------',this);
        if (this.msg.toUpperCase() == 'HI') {
            client.sendMessage(this.sender,'Hey...');
            client.sendMessage(this.sender,btn);
        }
    }

};


class ListRes {
    constructor(obj) {
        console.log(obj)
        switch (obj.listType) {
            case 'rating':
                actionQ.forEach((Qobj)=>{
                    if (Qobj.action == 'set progress' && Qobj.sender == obj.sender) {
                        Qobj.rating = obj.taskInfo;
                        console.log(actionQ)
                        Qwatcher(actionQ);
                    }
                })
                break;
            case 'list of task':
                obj.rating = '';
                addToQ(obj);
                client.sendMessage(obj.sender,ratingList)
                break;
        }
    }
}

var actionQ = [];

var client =  new Client()

client.on('qr', (qr) => {
    qrcode.generate(qr,{small:true})
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('authenticated', (session) => {
    console.log('authenticated')
});


var ask = new job ('00 01 22 * * *',()=>{
    connection.query(`CALL users_without_progress()`,[],(err,results)=>{
        if (err) console.log(err)
        var userIds = results[0];
        
        userIds.forEach((userId)=>{
            addToQ(userId.user,'prg')
            showList(userId.user,client,'set progress')
        })
    })
})


module.exports = {
    client      : client,
    Message     : Message,
    ask         : ask
}