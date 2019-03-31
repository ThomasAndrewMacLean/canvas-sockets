// tslint:disable-next-line:no-var-requires
// require('dotenv').config();
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
    secretAccessKey: process.env.SECRET_ACCESS_KEY
});

import uuidv4 = require('uuid/v4');
const s3 = new aws.S3();
const dynamodb = new aws.DynamoDB();

const xxx = process.env.ACCESS_KEY_ID;
console.log(process.env.ACCESS_KEY_ID);

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
        s3
    })
});

const saveItem = (imageUrl: string, slug: string, dataType: string) => {
    const params = {
        Item: {
            dataType: { S: dataType },
            id: { S: uuidv4() },
            imageUrl: { S: imageUrl },
            slug: { S: slug }
        },
        TableName: 'canvas-sockets'
    };

    dynamodb.putItem(params, (err: AWSError, data) => {
        if (err) {
            console.log(err);
        }
        console.log('data', data);
    });
};

const saveMessage = (
    username: string,
    message: string,
    slug: string,
    dataType: string
) => {
    const params = {
        Item: {
            dataType: { S: dataType },
            id: { S: uuidv4() },
            message: { S: message },
            slug: { S: slug },
            username: { S: username }
        },
        TableName: 'canvas-sockets'
    };

    dynamodb.putItem(params, (err: AWSError, data) => {
        if (err) {
            console.log(err);
        }
        console.log('data', data);
    });
};

// module.exports = upload;
app.use(express.static('src/public'));

app.get('/uuid', (req, res) => {
    return res.status(200).json(uuidv4());
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/start.html');
});

app.get('/:id', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

const singleUpload = upload.single('image');

app.post('/image-upload/:id', (req, res) => {
    singleUpload(req, res, (err: any) => {
        if (err) {
            return res.status(422).send({
                errors: [{ title: 'Image Upload Error', detail: err.message }]
            });
        }
        // @ts-ignore
        const imageUrl = req.file.location;

        io.emit('imageUrl', imageUrl);

        saveItem(imageUrl, req.params.id, 'imageURL');
        return res.json({ imageUrl });
    });
});

io.on('connection', (socketIO: any) => {
    console.log('a user connected', socketIO.id);

    socketIO.on(
        'chat message',
        (msg: { msg: string; username: string; id: string }) => {
            console.log('message: ' + msg.msg + ', username: ' + msg.username);
            saveMessage(msg.username, msg.msg, msg.id, 'message');
            io.emit('chat message', msg);
        }
    );

    socketIO.on('disconnect', () => {
        console.log('user disconnected', socketIO.id);
    });
});
http.listen(3000, () => {
    console.log('listening on *:3000');
});
