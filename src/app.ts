import express = require('express');
require('dotenv').config();
import socket = require('socket.io');
const app = express();
const http = require('http').Server(app);
const io = socket(http);

const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');

aws.config.update({
    // Your SECRET ACCESS KEY from AWS should go here,
    // Never share it!
    // Setup Env Variable, e.g: process.env.SECRET_ACCESS_KEY
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    // Not working key, Your ACCESS KEY ID from AWS should go here,
    // Never share it!
    // Setup Env Variable, e.g: process.env.ACCESS_KEY_ID
    accessKeyId: process.env.ACCESS_KEY_ID,
    region: 'eu-west-1', // region of your bucket
});

const s3 = new aws.S3();
const upload = multer({
    storage: multerS3({
        s3,
        bucket: 'canvas-sockets',
        acl: 'public-read',
        metadata(req: any, file: any, cb: any) {
            cb(null, { fieldName: file.fieldname });
        },
        key(req: any, file: any, cb: any) {
            cb(null, Date.now().toString());
        },
    }),
});

const dynamodb = new AWS.DynamoDB();
const params = {
    TableName: 'canvas-sockets',
    Item: {
        email: { S: 'jon@doe.com' },
        fullname: { S: 'Jon Doe' },
    },
};

dynamodb.putItem(params, callback);

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
        return res.json({ imageUrl: req.file.location });
    });
});

app.post('/test/:id', (req, res) => {
    return res.json({ test: req.params.id });
});
io.on('connection', (socket: any) => {
    console.log('a user connected', socket.id);

    socket.on('chat message', function(msg: any) {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
    });
});
http.listen(3000, function() {
    console.log('listening on *:3000');
});
