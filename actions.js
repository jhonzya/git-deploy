const fs = require('fs');
const shell = require('shelljs');
const _ = require('lodash');
var moment = require('moment');

if( process.env.SLACK_HOOK ){
    var slack = require('slack-notify')(process.env.SLACK_HOOK);
}

moment.locale('es');

var self = module.exports = {

    /**
     * type: log, info, error, warning
     */
    logger: (str, type='log', notify=true, attachments=[]) => {
        let time = moment().format('DD/MM/YYYY HH:mm:ss');
        const types = {
            'log': 'note',
            'info': 'success',
            'error': 'bug',
            'warning': 'alert'
        };

        str = `${process.env.name}: ${str}`
        if( !(type in types) ) type = 'log';
        console[type](time, str);

        // Send slack message
        if( notify && process.env.SLACK_HOOK ){
            const text = str;

            if( attachments.length === 0 ){
                slack[types[type]](text);
            }
            else{
                slack[types[type]]({text, attachments});
            }
        }
    },

    deploy: (dir, data) => {
        self.logger(`Se ha iniciado deploy en ${data.repo}, rama ${data.target}.`, 'info');

        var response = {
            status: 200,
            text: 'success'
        };

        const file = dir+'/.deployfile';
        var commands = null;

        // Read .deployfile
        try{
            if (fs.existsSync(file+'.'+data.target) ){
                commands = fs.readFileSync(file+'.'+data.target, 'utf8');
                commands = JSON.parse(commands).update;
            }
            else if( fs.existsSync(file) ){
                commands = fs.readFileSync(file, 'utf8');
                commands = JSON.parse(commands).update;
            }
            else{
                response.text = `Deployfile (${file}) for repo ${data.repo} and branch (${data.target}) doesn't exist`;
                response.status = 404;
            }
        }catch(error){
            response.text = error.message;
            response.status = 500;
        }

        // .deployfile not found
        if( commands === null ){
            self.finish_deploy(response, data);
            return;
        }

        // Exec commands
        process.chdir(dir);
        var results = [];

        commands.reduce((p, command) => {
            return p.then( () => {
                return self.exec_command(command).then((code) => {
                    results.push(code);
                });
            } );
        }, Promise.resolve()).then( () => {
            data['results'] = results;
            
            self.finish_deploy(response, data);
        }, (error) => {
            response.text = error;
            response.status = 500;
            
            self.finish_deploy(response, data);
        } );
    },

    exec_command: (cmd) => {
        self.logger(">"+cmd, 'log', false);
        return new Promise((resolve, reject) => {
            shell.exec(cmd, {silent: true}, (code, stdout, stderr) => {
                resolve(code === 0 ? {cmd, code, stdout} : {cmd, code, stderr});
            });
        });
    },

    finish_deploy(response, data){
        let time = moment().format('DD/MM/YYYY HH:mm:ss');
        let dif = moment.utc(
                moment(time,"DD/MM/YYYY HH:mm:ss")
                .diff(moment(data['started'],"DD/MM/YYYY HH:mm:ss"))
            ).format("mm [m] ss [s]");
        let message =   `(${dif}) Ha finalizado deploy en ${data.repo}, rama ${data.target}.`;
        let type = 'info';
        let attachments = [];

        if(response.status !== 200){
            type = 'error';

            attachments.push({
                title: 'Ha ocurrido un error',
                text: response.text,
                color: 'danger'
            });
        }
        else{
            process.chdir(__dirname);
            var filename = process.env.name+"_"+moment().format('DD-MM-YYYY_HH-mm-ss')+".log";
            fs.writeFile('./logs/'+filename, JSON.stringify(data['results'], 0, 2), (error) => {
                if(error) self.logger(error, 'error', false);
            });

            var fields = [];
            _.each(data.commits, commit => {
                fields.push({
                    title: commit.message,
                    value: `${commit.author.name} (<${commit.url}|ver commit>)`,
                    short: false
                });
            });

            attachments.push({
                color: "good",
                fields: fields
            });
        }

        self.logger(message, type, true, attachments);
    }

};
