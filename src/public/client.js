console.log("JS loaded ***")
const startBtn= document.getElementById("startBtn")

startBtn.addEventListener("click", (e) => {
e.preventDefault();

const url = window.location.origin
fetch(url + "/uuid").then(x => x.json()).then(y => {
    window.location.href = url + "/" + y;
})
})