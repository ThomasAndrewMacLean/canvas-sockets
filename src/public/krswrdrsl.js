console.log('STARTING');
let username = localStorage.getItem('username');

while (!username) {
    username = prompt('fill in your username:', 'anon');
}
localStorage.setItem('username', username);

const socket = io();

const form = document.getElementById('form');
form.addEventListener('submit', e => {
    e.preventDefault(); // prevents page reloading
    const field = form.elements[0];
    socket.emit('chat message', {
        msg: field.value,
        username,
        id: window.location.pathname.replace('/', '')
    });
    field.value = '';
    return false;
});

const formfile = document.getElementById('form-file');

const url = window.location.origin + '/image-upload' + window.location.pathname;

// formData.append('username', 'abc123');

const uploadPhotoInput = document.getElementById('imgupload');
uploadPhotoInput.addEventListener('change', e => {
    e.preventDefault();

    var formData = new FormData();
    formData.append('image', uploadPhotoInput.files[0]);
    fetch(url, {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .catch(error => console.error('Error:', error))
        .then(
            response => console.log('response:', JSON.stringify(response)) // clear this uploadPhotoInput
        );
});

socket.on('chat message', function(msg) {
    const li = document.createElement('li');
    li.textContent = msg.msg;
    const ul = document.getElementById('messages');
    ul.appendChild(li);
});

socket.on('imageUrl', function(imageUrl) {
    const image = document.getElementById('image');
    image.src = imageUrl;
});

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// canvas.addEventListener('mousedown', e => {
//     console.log(e);
//     socket.emit('canvas-mouse', { x: e.offsetX, y: e.offsetY });
// });

var mouseDown = 0;
document.body.onmousedown = function() {
    mouseDown = 1;
};
document.body.onmouseup = function() {
    mouseDown = 0;
};

document.addEventListener('mousemove', onMouseMove, false);

function onMouseMove(e) {
    if (mouseDown) {
        socket.emit('canvas-mouse', { x: e.offsetX, y: e.offsetY });
    }
}
socket.on('draw', data => {
    console.log(data);
    ctx.fillRect(data.x, data.y, 3, 3);
});
