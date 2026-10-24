# To-Do App (Spring Boot + HTML/CSS/JS)

A beginner full stack app: a Java REST API on the backend and a plain
HTML, CSS and JavaScript page on the frontend, served by the same app.

## Run it

You need **Java 17+** and **Maven** (or open the folder in IntelliJ / Eclipse / VS Code).

```bash
mvn spring-boot:run
```

Then open **http://localhost:8080** in your browser.

In an IDE you can instead run `TodoApplication.java` directly.

## Features

- Add, edit (double-click or Edit button), complete and delete tasks
- Filter by All / Active / Completed
- Clear all completed tasks
- Data is saved in an H2 database file (`./data/tododb`), so it survives restarts
- Validation errors from the backend (e.g. empty title) show up on the page

## Project structure

```
todo-app/
├── pom.xml                                   Maven dependencies
└── src/main/
    ├── java/com/example/todo/
    │   ├── TodoApplication.java              starts the app
    │   ├── Todo.java                         entity (database table)
    │   ├── TodoRepository.java               database access
    │   ├── TodoController.java               REST endpoints
    │   └── ApiExceptionHandler.java          turns errors into JSON
    └── resources/
        ├── application.properties            port + database settings
        └── static/                           the frontend
            ├── index.html
            ├── style.css
            └── app.js                        calls the API with fetch()
```

## How the pieces talk

1. You type a task and click **Add**.
2. `app.js` sends `POST /api/todos` with `{"title": "..."}`.
3. `TodoController` validates it and saves it through `TodoRepository`.
4. Hibernate writes a row to the H2 database and the saved todo comes back as JSON.
5. `app.js` adds it to the list and redraws the page.

## API

| Method | URL                     | What it does         |
|--------|-------------------------|----------------------|
| GET    | `/api/todos`            | List all to-dos      |
| POST   | `/api/todos`            | Create a to-do       |
| PUT    | `/api/todos/{id}`       | Update title/status  |
| DELETE | `/api/todos/{id}`       | Delete one           |
| DELETE | `/api/todos/completed`  | Delete all completed |

Try it from the terminal:

```bash
curl -X POST localhost:8080/api/todos -H "Content-Type: application/json" -d '{"title":"Learn Spring Boot"}'
curl localhost:8080/api/todos
```

## Look inside the database

Open **http://localhost:8080/h2-console**, use JDBC URL `jdbc:h2:file:./data/tododb`,
user `sa`, empty password, and run `SELECT * FROM TODO;`.

## Deploy it for free on Render

The project includes a `Dockerfile`, so Render can build and run it with no extra setup.

1. **Put the code on GitHub.** Create an empty repository on github.com, then in the `todo-app` folder run:
   ```bash
   git init
   git add .
   git commit -m "To-Do app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/todo-app.git
   git push -u origin main
   ```
2. **Create the service.** Sign up at render.com with your GitHub account. Click **New → Web Service**,
   pick the `todo-app` repository, choose **Language: Docker** and **Instance type: Free**, and click **Deploy**.
3. **Wait for the first build** (about 5–10 minutes). Your URL will look like `https://todo-app-xxxx.onrender.com`.

Every `git push` to `main` redeploys the app automatically.

**Things to know about the free plan**
- The app sleeps after 15 minutes with no visitors. The next visit takes about a minute to wake it.
- The H2 database file is wiped whenever the app sleeps, restarts or redeploys. That's fine for a demo.
  To keep your to-dos, use a free Postgres database (next section).

### Optional: keep your data with a free Postgres database

1. Create a free database at [neon.tech](https://neon.tech) and copy its connection details.
2. In Render, open your service → **Environment** and add these variables:

   | Key                 | Value                                                        |
   |---------------------|--------------------------------------------------------------|
   | `DATABASE_URL`      | `jdbc:postgresql://<host>/<database>?sslmode=require`        |
   | `DATABASE_USERNAME` | your Neon user                                               |
   | `DATABASE_PASSWORD` | your Neon password                                           |

   Neon shows a URL like `postgresql://user:pass@host/db`. Take the host and database name from it and
   build the `jdbc:postgresql://...` form above. Don't put the user and password inside the URL.
3. Save. Render redeploys, and Hibernate creates the `todo` table on first start.

No code changes are needed: the app reads these variables and falls back to H2 when they aren't set.

## Ideas to extend it

- Add a due date and priority to each task
- Switch H2 to MySQL (change the dependency and `spring.datasource.*` settings)
- Add user login with Spring Security so each person has their own list
- Write tests for the controller with `@WebMvcTest`
