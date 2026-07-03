const express = require("express");

const app = express();

const PORT = 3000;

app.use(express.json());

let tasks = [
  { id: 1, task: "Learn Docker" },
  { id: 2, task: "Learn Jenkins" }
];

app.get("/", (req, res) => {
  res.send("<h1>🚀 DevOps Task Manager is Running!</h1>");
});

app.get("/tasks", (req, res) => {
  res.json(tasks);
});

app.post("/tasks", (req, res) => {
  const newTask = {
    id: tasks.length + 1,
    task: req.body.task
  };

  tasks.push(newTask);

  res.status(201).json(newTask);
});

app.delete("/tasks/:id", (req, res) => {

  const id = Number(req.params.id);

  tasks = tasks.filter(task => task.id !== id);

  res.json({
    message: "Task Deleted"
  });

});

app.get("/health", (req, res) => {

  res.json({
    status: "Running"
  });

});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});