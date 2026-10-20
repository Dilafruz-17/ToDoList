const STORAGE_KEY = "todo-tasks"

const STATUS = {
    LIST: "list",
    PROGRESS: "progress",
    DONE: "done"
}

const COLUMNS = [
    { status: STATUS.LIST, title: "List" },
    { status: STATUS.PROGRESS, title: "Progress" },
    { status: STATUS.DONE, title: "Done" }
]

function createElement(tag, className, text = "") {
    const element = document.createElement(tag)
    element.className = className
    element.textContent = text
    return element
}

class TaskStorage {
    constructor(key) {
        this.key = key
    }

    load() {
        try {
            const saved = localStorage.getItem(this.key)
            return saved ? JSON.parse(saved) : []
        } catch (error) {
            return []
        }
    }

    save(tasks) {
        try {
            localStorage.setItem(this.key, JSON.stringify(tasks))
        } catch (error) {
            // saqlab bo'lmasa ham dastur ishlashda davom etadi
        }
    }
}


class TaskStore {
    constructor(storage) {
        this.storage = storage
        this.tasks = storage.load()
        this.nextId = Math.max(0, ...this.tasks.map(task => task.id)) + 1
        this.listeners = []
    }

    onChange(listener) {
        this.listeners.push(listener)
    }

    add(text) {
        this.tasks.push({ id: this.nextId++, text: text, status: STATUS.LIST })
        this.commit()
    }

    remove(id) {
        this.tasks = this.tasks.filter(task => task.id !== id)
        this.commit()
    }

    move(id, status) {
        const task = this.tasks.find(task => task.id === id)
        if (!task) return

        task.status = status
        this.commit()
    }

    getByStatus(status) {
        return this.tasks.filter(task => task.status === status)
    }

    commit() {
        this.storage.save(this.tasks)
        this.listeners.forEach(listener => listener())
    }
}

class BoardView {
    constructor(root, columns, onDelete) {
        this.onDelete = onDelete
        this.columnElements = new Map()

        columns.forEach(({ status, title }) => {
            const column = createElement("section", "column")
            column.dataset.status = status

            const head = createElement("div", "column-head")
            head.append(createElement("h2", "", title), createElement("span", "count", "0"))

            column.append(head, createElement("div", "task-list"))
            root.appendChild(column)
            this.columnElements.set(status, column)
        })
    }

    render(getTasks) {
        this.columnElements.forEach((column, status) => {
            const tasks = getTasks(status)
            const list = column.querySelector(".task-list")

            list.textContent = ""

            if (tasks.length === 0) {
                list.appendChild(createElement("p", "empty", "Drop a task here"))
            } else {
                tasks.forEach(task => list.appendChild(this.createCard(task)))
            }

            column.querySelector(".count").textContent = tasks.length
        })
    }

    createCard(task) {
        const card = createElement("div", "task")
        card.draggable = true
        card.dataset.id = task.id

        const deleteButton = createElement("button", "delete")
        deleteButton.setAttribute("aria-label", "Delete task")
        deleteButton.appendChild(createElement("i", "bi bi-x-lg"))
        deleteButton.addEventListener("click", () => this.onDelete(task.id))

        card.append(
            createElement("i", "bi bi-grip-vertical grip"),
            createElement("span", "task-text", task.text),
            deleteButton
        )
        return card
    }
}

class SummaryView {
    constructor(element) {
        this.element = element
    }

    render(total, done) {
        const word = total === 1 ? "task" : "tasks"
        this.element.textContent = `${total} ${word}, ${done} done`
    }
}

class AddTaskForm {
    constructor(form, input, errorElement, onSubmit) {
        input.addEventListener("input", () => {
            errorElement.textContent = ""
        })

        form.addEventListener("submit", event => {
            event.preventDefault()

            const text = input.value.trim()
            if (text === "") {
                errorElement.textContent = "Enter a task first"
                input.focus()
                return
            }

            onSubmit(text)
            input.value = ""
            input.focus()
        })
    }
}

class DragAndDrop {
    constructor(root, onDrop) {
        root.addEventListener("dragstart", event => {
            const card = event.target.closest(".task")
            if (!card) return

            event.dataTransfer.setData("text/plain", card.dataset.id)
            card.classList.add("dragging")
        })

        root.addEventListener("dragend", event => {
            const card = event.target.closest(".task")
            if (card) card.classList.remove("dragging")
        })

        root.addEventListener("dragover", event => {
            const column = event.target.closest(".column")
            if (!column) return

            event.preventDefault()
            column.classList.add("drag-over")
        })

        root.addEventListener("dragleave", event => {
            const column = event.target.closest(".column")
            if (column && !column.contains(event.relatedTarget)) {
                column.classList.remove("drag-over")
            }
        })

        root.addEventListener("drop", event => {
            const column = event.target.closest(".column")
            if (!column) return

            event.preventDefault()
            column.classList.remove("drag-over")

            const id = Number(event.dataTransfer.getData("text/plain"))
            onDrop(id, column.dataset.status)
        })
    }
}

class App {
    constructor() {
        const boardElement = document.getElementById("board")

        this.store = new TaskStore(new TaskStorage(STORAGE_KEY))
        this.board = new BoardView(boardElement, COLUMNS, id => this.store.remove(id))
        this.summary = new SummaryView(document.getElementById("summary"))

        new AddTaskForm(
            document.getElementById("add-form"),
            document.getElementById("task-input"),
            document.getElementById("error"),
            text => this.store.add(text)
        )
        new DragAndDrop(boardElement, (id, status) => this.store.move(id, status))

        this.store.onChange(() => this.render())
        this.render()
    }

    render() {
        this.board.render(status => this.store.getByStatus(status))
        this.summary.render(this.store.tasks.length, this.store.getByStatus(STATUS.DONE).length)
    }
}

new App()