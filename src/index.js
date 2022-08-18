const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  let { username } = request.headers;

  let user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "User not found!"});
  }

  request.user = user;

  return next();
}

function checksExistsTodo(request, response, next) {
  const { username } = request.headers;
  const { id } = request.params;

  const user = users.find(user => user.username === username);

  if(!user) {
      response.status(404).json({error: `Username ${username} not found!`});
  }

  const todoExists = user.todos.find(todo => todo.id === id);
  
  if(!todoExists) {
      response.status(404).json({error: 'Todo not found!'});
  }

  request.user = user;
  request.todo = todoExists;

  return next();

}

app.post('/users', (request, response) => {
  let { name, username } = request.body;

  let userAlreadyExists = users.some(
    (user) => user.username === username
  );

  if (userAlreadyExists) {
    return response.status(400).json({ error: "Username already exists"});
  }

   users.push ({
    id: uuidv4(),
    name,
    username,
    todos: [],
    created_at: new Date()
  });

  return response.status(201).json(users[users.length-1]);
});

app.get('/users', (request, response) => {
  return response.json(users);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  let { user } = request;

  return response.status(200).json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  let { title, deadline } = request.body;
  let { user } = request;

  let todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(todo);

  return response.status(201).send(todo);

});

app.put('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  let { title, deadline } = request.body;
  let { todo }  = request;


  todo.title = title;
  todo.deadline = deadline;

  return response.status(200).send(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  let  { todo }  = request;

  todo.done = true;

  return response.status(200).send(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  let { id } = request.params;
  let { user } = request;
  let { todo } = request;

  let task = user.todos.findIndex((todo) => todo.id === id);

  user.todos.splice(task, 1);

  return response.status(204).json(todo);
});

module.exports = app;