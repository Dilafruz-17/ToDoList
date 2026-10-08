let input = document.getElementById("input")
let add = document.getElementById("add")
let boxs = document.getElementsByClassName("boxs")
let exercise = document.getElementById("exercise")

add.addEventListener("click", function (){
    exercise.textContent = input.value
}) 

exercise.addEventListener("dragstart", function(){
    console.log("Sudrash boshlandi")
}) 

for (let box of boxs) {

    box.addEventListener("dragover", function (e) {
        e.preventDefault()
    })

    box.addEventListener("drop", function () {
        box.appendChild(exercise)
    })

}