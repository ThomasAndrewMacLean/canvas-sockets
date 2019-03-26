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

import uuidv4 = require('uuid/v4');
const s3 = new aws.S3();
const dynamodb = new aws.DynamoDB();

aws.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID,
    region: 'eu-west-1',
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

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

const saveItem = (imageUrl: string, slug: string) => {
    const params = {
        Item: {
            id: { S: uuidv4() },
            imageUrl: { S: imageUrl },
            slug: { S: slug },
        },
        TableName: 'canvas-sockets',
    };

    dynamodb.putItem(params, (err: AWSError, data) => {
        if (err) {
            console.log(err);
        }
        console.log(data);
    });
};

// module.exports = upload;
app.use(express.static('src/public'));

app.post('/testing', (req, res) => {
    return res.status(200).json(process.env.SECRET_ACCESS_KEY);
});

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
                errors: [{ title: 'Image Upload Error', detail: err.message }],
            });
        }
        // @ts-ignore
        const imageUrl = req.file.location;

        io.emit('imageUrl', imageUrl);

        saveItem(imageUrl, req.params.id);
        return res.json({ imageUrl });
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
