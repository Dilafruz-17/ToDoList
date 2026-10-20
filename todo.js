const STORAGE_KEY = "todo-tasks"

const form = document.getElementById("add-form")
const input = document.getElementById("task-input")
const errorText = document.getElementById("error")
const summary = document.getElementById("summary")
const columns = document.querySelectorAll(".column")

// Har bir vazifa: { id: 1, text: "Read a book", status: "list" }
// status: "list" | "progress" | "done"
let tasks = loadTasks()

function loadTasks() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        return saved ? JSON.parse(saved) : []
    } catch (error) {
        return []
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch (error) {
        // saqlab bo'lmasa ham dastur ishlashda davom etadi
    }
}

function addTask(text) {
    tasks.push({
        id: Date.now(),
        text: text,
        status: "list"
    })
    saveTasks()
    render()
}

function deleteTask(id) {
    tasks = tasks.filter(function (task) {
        return task.id !== id
    })
    saveTasks()
    render()
}

function moveTask(id, newStatus) {
    const task = tasks.find(function (task) {
        return task.id === id
    })
    if (!task) return

    task.status = newStatus
    saveTasks()
    render()
}

function createTaskElement(task) {
    const card = document.createElement("div")
    card.className = "task"
    card.draggable = true

    const grip = document.createElement("i")
    grip.className = "bi bi-grip-vertical grip"

    const text = document.createElement("span")
    text.className = "task-text"
    text.textContent = task.text

    const deleteButton = document.createElement("button")
    deleteButton.className = "delete"
    deleteButton.setAttribute("aria-label", "Delete task")
    deleteButton.innerHTML = '<i class="bi bi-x-lg"></i>'
    deleteButton.addEventListener("click", function () {
        deleteTask(task.id)
    })

    card.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", String(task.id))
        card.classList.add("dragging")
    })

    card.addEventListener("dragend", function () {
        card.classList.remove("dragging")
    })

    card.append(grip, text, deleteButton)
    return card
}

function render() {
    columns.forEach(function (column) {
        const status = column.dataset.status
        const list = column.querySelector(".task-list")
        const columnTasks = tasks.filter(function (task) {
            return task.status === status
        })

        list.textContent = ""

        columnTasks.forEach(function (task) {
            list.appendChild(createTaskElement(task))
        })

        if (columnTasks.length === 0) {
            const empty = document.createElement("p")
            empty.className = "empty"
            empty.textContent = "Drop a task here"
            list.appendChild(empty)
        }

        column.querySelector(".count").textContent = columnTasks.length
    })

    const doneCount = tasks.filter(function (task) {
        return task.status === "done"
    }).length
    const word = tasks.length === 1 ? "task" : "tasks"
    summary.textContent = tasks.length + " " + word + ", " + doneCount + " done"
}

// Add tugmasi yoki Enter bosilganda
form.addEventListener("submit", function (e) {
    e.preventDefault()

    const text = input.value.trim()
    if (text === "") {
        errorText.textContent = "Enter a task first"
        input.focus()
        return
    }

    addTask(text)
    input.value = ""
    errorText.textContent = ""
    input.focus()
})

input.addEventListener("input", function () {
    errorText.textContent = ""
})

// Drag and drop: har bir ustun vazifani qabul qiladi
columns.forEach(function (column) {
    column.addEventListener("dragover", function (e) {
        e.preventDefault()
        column.classList.add("drag-over")
    })

    column.addEventListener("dragleave", function (e) {
        if (!column.contains(e.relatedTarget)) {
            column.classList.remove("drag-over")
        }
    })

    column.addEventListener("drop", function (e) {
        e.preventDefault()
        column.classList.remove("drag-over")

        const id = Number(e.dataTransfer.getData("text/plain"))
        moveTask(id, column.dataset.status)
    })
})

render()