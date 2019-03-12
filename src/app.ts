// tslint:disable-next-line:no-var-requires
require('dotenv').config();
import express = require('express');
import socket = require('socket.io');
const app = express();
// tslint:disable-next-line:no-var-requires
const http = require('http').Server(app);
const io = socket(http);

import aws = require('aws-sdk');
import { AWSError } from 'aws-sdk';
import multer = require('multer');
import multerS3 = require('multer-s3');

aws.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID,
    region: 'eu-west-1',
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

const s3 = new aws.S3();
const upload = multer({
    storage: multerS3({
        acl: 'public-read',
        bucket: 'canvas-sockets',
        metadata(req: any, file: any, cb: any) {
            cb(null, { fieldName: file.fieldname });
        },
        key(req: any, file: any, cb: any) {
            cb(null, Date.now().toString());
        },
        s3,
    }),
});

const dynamodb = new aws.DynamoDB();
const params = {
    Item: {
        email: { S: 'jon@doe.com' },
        fullname: { S: 'Jon Doe' },
        id: { S: '1' },
    },
    TableName: 'canvas-sockets',
};

dynamodb.putItem(params, (err: AWSError, data) => {
    if (err) {
        // tslint:disable-next-line:no-console
        console.log(err);
    }
    // tslint:disable-next-line:no-console
    console.log(data);
});

// module.exports = upload;
app.use(express.static('src/public'));

app.get('/:id', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const singleUpload = upload.single('image');

app.post('/image-upload/:id', (req, res) => {
    singleUpload(req, res, (err: any) => {
        if (err) {
            return res.status(422).send({
                errors: [{ title: 'Image Upload Error', detail: err.message }],
            });
        }
        // @ts-ignore
        return res.json({ imageUrl: req.file.location });
    });
});

app.post('/test/:id', (req, res) => {
    io.emit('chat message', req.params.id);
    return res.json({ test: req.params.id });
});
io.on('connection', (socketIO: any) => {
    console.log('a user connected', socketIO.id);

    socketIO.on('chat message', (msg: any) => {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });

    socketIO.on('disconnect', () => {
        console.log('user disconnected', socketIO.id);
    });
});
http.listen(3000, () => {
    console.log('listening on *:3000');
});
