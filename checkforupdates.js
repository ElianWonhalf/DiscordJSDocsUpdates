#!/usr/bin/nodejs

'use strict';

const execSync = require('child_process').execSync;
const https = require('https');
const fs = require('fs');
const nodemailer = require('nodemailer');
const configuration = require('./configure');

const query = function (path) {
    var options = {
        'method': 'GET',
        'hostname': 'api.github.com',
        'port': null,
        'path': path,
        'headers': {
            'Cache-Control': 'no-cache',
            'User-Agent': 'Discord.JS documentation updates'
        }
    };

    return new Promise(function (resolve, reject) {
        var req = https.request(options, function (res) {
            var chunks = [];

            res.on('data', chunk => chunks.push(chunk));
            res.on('error', error => reject(error));
            res.on('end', () => {
                var body = Buffer.concat(chunks);
                resolve(JSON.parse(body.toString()));
            });
        });

        req.end();
    });
};

const sendMail = function (subject, text, html) {
    var transporter = nodemailer.createTransport('smtps://' + configuration.user + '%40gmail.com:' + configuration.password + '@smtp.gmail.com');
    var mailOptions = {
        from: '"Bewink" <elianwonhalf@gmail.com>',
        to: configuration.dest.join(', '),
        subject: '[Discord.JS docs Update] ' + subject,
        text: text,
        html: html
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        }
    });
};

query('/repos/hydrabolt/discord.js/branches/docs').then(data => {
    var treeUrl = data.commit.commit.tree.url;
    
    query(treeUrl).then(data => {
        var files = data.tree.filter(e => e.path.match(/^(\d+\.){3}json$/));
        var lastFileRead = null;
        var firstRun = true;
        
        files = files.sort(function (a, b) {
            var versionA = a.path.replace(/\.json/, '').replace(/\./g, '');
            var versionB = b.path.replace(/\.json/, '').replace(/\./g, '');
            
            return versionB - versionA;
        });
        
        var lastFile = files[0];
        
        try {
            lastFileRead = JSON.parse(fs.readFileSync('.cache', {encoding: 'utf8'}));
            firstRun = false;
        } catch (e) {
            fs.writeFileSync('.cache', '{}');
            lastFileRead = JSON.parse(fs.readFileSync('.cache', {encoding: 'utf8'}));
            firstRun = true;
        }

        var lastFileData = {
            name: lastFile.path,
            sha: lastFile.sha
        };
        
        query(lastFile.url).then(data => {
            var subject = null;
            var textContent = null;
            var htmlContent = null;
            var log = '';
            var date = new Date();
            
            lastFileData.content = JSON.parse(new Buffer(data.content, 'base64').toString());
            
            if (firstRun) {
                subject = 'First run, huh?';
                
                textContent = 'Discord.JS documentation updates\n\n';
                textContent += 'It\'s the first time you run this script, so I can just tell you that the last Discord.JS version is the ' + lastFileData.name.replace('.json', '') + ' one\n\n';
                textContent += 'If you don\'t want to receive these updates anymore, please e-mail me at elianwonhalf@gmail.com';
                
                htmlContent = '<h1>Discord.JS documentation updates</h1>';
                htmlContent += '<p>It\'s the first time you run this script, so I can just tell you that the last Discord.JS version is the ' + lastFileData.name.replace('.json', '') + ' one</p>';
                htmlContent += '<p>If you don\'t want to receive these updates anymore, please e-mail me at <a href="mailto:elianwonhalf@gmail.com">elianwonhalf@gmail.com</a></p>';
                
                log = 'First run';
            } else {
                if (lastFileRead.name != lastFileData.name) {
                    fs.writeFileSync('.file1', JSON.stringify(lastFileRead.content, null, 4));
                    fs.writeFileSync('.file2', JSON.stringify(lastFileData.content, null, 4));
                    
                    var diffUrl = execSync('diffchecker .file1 .file2', {encoding: 'utf8'});
                    diffUrl = diffUrl.substr(diffUrl.indexOf('https://')).trim();
                    
                    fs.unlinkSync('.file1');
                    fs.unlinkSync('.file2');

                    subject = 'New version!';
                    
                    textContent = 'Discord.JS documentation updates\n\n';
                    textContent += 'Last update was the ' + lastFileRead.name.replace('.json', '') + ' one, and the one released just now is the ' + lastFileData.name.replace('.json', '') + ' one\n';
                    textContent += 'You can see the full diff here: ' + diffUrl + '\n\n';
                    textContent += 'If you don\'t want to receive these updates anymore, please e-mail me at elianwonhalf@gmail.com';
                    
                    htmlContent = '<h1>Discord.JS documentation updates</h1>';
                    htmlContent += '<p>Last update was the ' + lastFileRead.name.replace('.json', '') + ' one, and the one released just now is the ' + lastFileData.name.replace('.json', '') + ' one<br />';
                    htmlContent += 'You can see the full diff here: <a href="' + diffUrl + '">' + diffUrl + '</a></p>';
                    htmlContent += '<p>If you don\'t want to receive these updates anymore, please e-mail me at <a href="mailto:elianwonhalf@gmail.com">elianwonhalf@gmail.com</a></p>';
                    
                    log = 'New version';
                } else {
                    if (lastFileRead.sha != lastFileData.sha) {
                        fs.writeFileSync('.file1', JSON.stringify(lastFileRead.content, null, 4));
                        fs.writeFileSync('.file2', JSON.stringify(lastFileData.content, null, 4));
                        
                        var diffUrl = execSync('diffchecker .file1 .file2', {encoding: 'utf8'});
                        diffUrl = diffUrl.substr(diffUrl.indexOf('https://')).trim();
                    
                        fs.unlinkSync('.file1');
                        fs.unlinkSync('.file2');
                        
                        subject = 'New update of latest version!';
                        
                        textContent = 'Discord.JS documentation updates\n\n';
                        textContent += 'Last update was the ' + lastFileRead.name.replace('.json', '') + ' one, and it has been updated!\n\n';
                        textContent += 'You can see the full diff here: ' + diffUrl + '\n\n';
                        textContent += 'If you don\'t want to receive these updates anymore, please e-mail me at elianwonhalf@gmail.com';
                        
                        htmlContent = '<h1>Discord.JS documentation updates</h1>';
                        htmlContent += '<p>Last update was the ' + lastFileRead.name.replace('.json', '') + ' one, and it has been updated!<br />';
                        htmlContent += 'You can see the full diff here: <a href="' + diffUrl + '">' + diffUrl + '</a></p>';
                        htmlContent += '<p>If you don\'t want to receive these updates anymore, please e-mail me at <a href="mailto:elianwonhalf@gmail.com">elianwonhalf@gmail.com</a></p>';

                        log = 'New update of latest version';
                    } else {
                        log = 'No new update';
                    }
                }
            }
            
            fs.writeFileSync('.cache', JSON.stringify(lastFileData));
            
            if (subject != null) {
                sendMail(subject, textContent, htmlContent);
            }
            
            console.log(date.toLocaleString() + ' - ' + log);
        }).catch(error => console.log(error));
    }).catch(error => console.log(error));
}).catch(error => console.log(error));
