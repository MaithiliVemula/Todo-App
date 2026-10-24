// Base URL of our Spring Boot REST API
const API = "/api/todos";

// App state
let todos = [];
let currentFilter = "all";

// Grab the elements we need from the page
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const errorEl = document.getElementById("error");
const emptyEl = document.getElementById("empty");
const summaryEl = document.getElementById("summary");
const clearBtn = document.getElementById("clear-completed");

// ---------- Talking to the backend ----------

// Small helper around fetch() that sends/receives JSON and throws on errors
async function request(url, options = {}) {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
            const body = await response.json();
            if (body.error) message = body.error;
        } catch (_) { /* response had no JSON body */ }
        throw new Error(message);
    }
    // 204 No Content has no body to parse
    return response.status === 204 ? null : response.json();
}

async function loadTodos() {
    try {
        todos = await request(API);
        render();
    } catch (err) {
        showError("Could not load to-dos. Is the server running?");
    }
}

async function addTodo(title) {
    const created = await request(API, {
        method: "POST",
        body: JSON.stringify({ title }),
    });
    todos.unshift(created); // newest first
    render();
}

async function updateTodo(todo, changes) {
    const updated = await request(`${API}/${todo.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...todo, ...changes }),
    });
    todos = todos.map(t => (t.id === updated.id ? updated : t));
    render();
}

async function deleteTodo(id) {
    await request(`${API}/${id}`, { method: "DELETE" });
    todos = todos.filter(t => t.id !== id);
    render();
}

async function clearCompleted() {
    await request(`${API}/completed`, { method: "DELETE" });
    todos = todos.filter(t => !t.completed);
    render();
}

// ---------- Drawing the page ----------

function render() {
    const visible = todos.filter(t =>
        currentFilter === "active" ? !t.completed :
        currentFilter === "completed" ? t.completed : true
    );

    list.innerHTML = "";
    visible.forEach(todo => list.appendChild(createTodoElement(todo)));

    emptyEl.hidden = visible.length > 0;

    const remaining = todos.filter(t => !t.completed).length;
    summaryEl.textContent = todos.length === 0
        ? "No tasks yet"
        : `${remaining} of ${todos.length} task${todos.length === 1 ? "" : "s"} left`;

    clearBtn.hidden = !todos.some(t => t.completed);
}

function createTodoElement(todo) {
    const li = document.createElement("li");
    li.className = "todo" + (todo.completed ? " done" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", "Mark as done");
    checkbox.addEventListener("change", () =>
        safely(() => updateTodo(todo, { completed: checkbox.checked }))
    );

    // textContent (not innerHTML) so user text can never inject HTML
    const title = document.createElement("span");
    title.className = "title";
    title.textContent = todo.title;
    title.addEventListener("dblclick", () => startEditing(li, todo, title));

    const actions = document.createElement("div");
    actions.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => startEditing(li, todo, title));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-btn delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => safely(() => deleteTodo(todo.id)));

    actions.append(editBtn, deleteBtn);
    li.append(checkbox, title, actions);
    return li;
}

// Swap the title text for an input box; Enter saves, Escape cancels
function startEditing(li, todo, titleEl) {
    const editInput = document.createElement("input");
    editInput.className = "edit-input";
    editInput.value = todo.title;
    editInput.maxLength = 200;
    li.replaceChild(editInput, titleEl);
    editInput.focus();
    editInput.select();

    let finished = false;
    const finish = save => {
        if (finished) return;
        finished = true;
        const newTitle = editInput.value.trim();
        if (save && newTitle && newTitle !== todo.title) {
            safely(() => updateTodo(todo, { title: newTitle }));
        } else {
            render();
        }
    };

    editInput.addEventListener("keydown", e => {
        if (e.key === "Enter") finish(true);
        if (e.key === "Escape") finish(false);
    });
    editInput.addEventListener("blur", () => finish(true));
}

// ---------- Helpers ----------

function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
}

function clearError() {
    errorEl.hidden = true;
}

// Runs an async action and shows any error message on the page
async function safely(action) {
    clearError();
    try {
        await action();
    } catch (err) {
        showError(err.message);
    }
}

// ---------- Event listeners ----------

form.addEventListener("submit", e => {
    e.preventDefault(); // stop the browser from reloading the page
    const title = input.value.trim();
    if (!title) return;
    safely(async () => {
        await addTodo(title);
        input.value = "";
        input.focus();
    });
});

document.querySelectorAll(".filter").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".filter.active").classList.remove("active");
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        render();
    });
});

clearBtn.addEventListener("click", () => safely(clearCompleted));

// Load the list when the page opens
loadTodos();
