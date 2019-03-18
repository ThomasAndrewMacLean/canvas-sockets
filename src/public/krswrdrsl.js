console.log('STARTING');
let username = localStorage.getItem("username");

while(!username){
     username = prompt("fill in your username:", "anon")
}
localStorage.setItem("username", username);

const socket = io();

const form = document.getElementById('form');
form.addEventListener('submit', e => {
    e.preventDefault(); // prevents page reloading
    const field = form.elements[0];
    socket.emit('chat message', field.value);
    field.value = '';
    return false;
});
const canvas = document.getElementById('canvas');
canvas.addEventListener("mousedown",(e)=> {
    console.log(e)
    socket.emit('canvas-mouse', {x:e.offsetX, y: e.offsetY})

})

const formfile = document.getElementById('form-file');

const url = window.location.origin + '/image-upload' + window.location.pathname;

// formData.append('username', 'abc123');

const uploadPhotoInput = document.getElementById("imgupload");
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
        .then(response =>
            console.log('response:', JSON.stringify(response)), // clear this uploadPhotoInput
        );
})

socket.on('chat message', function (msg) {
    const li = document.createElement('li');
    li.textContent = msg;
    const ul = document.getElementById('messages');
    ul.appendChild(li);
});

socket.on('imageUrl', function (imageUrl) {

    const image = document.getElementById('image');
    image.src = imageUrl;
});