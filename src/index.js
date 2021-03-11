const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');
const validate = require("uuid-validate");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
    const { username } = request.headers;

    const user = users.find(user => user.username === username);

    if(!user) {
        return response.status(404).json({error: 'Username not found!'});
    }

    request.user = user;

    return next();
}

function checksExistTodo(request, response, next) {
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

    next();
}

app.post('/users',(request, response) => {
    const { name, username } = request.body;

    const userNameAlreadyExists = users.some((user) => user.username === username);

    if (userNameAlreadyExists) {
        return response.status(400).json({error: 'Username already exists!'});
    }

    users.push({
        id: uuidv4(),
        name,
        username,
        todos: [],
    });

    return response.status(201).send(users[users.length-1]);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
    const { user } = request;

    return response.status(200).json(user.todos);    
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
    const { user } = request;
    const { title, deadline } = request.body;

    const task = {
        id: uuidv4(),
        title,
        done: false,
        deadline: new Date(deadline),
        created_at: new Date(),
    }

    user.todos.push(task);

    return response.status(201).send(task);
});

app.put('/todos/:id', checksExistsUserAccount, checksExistTodo, (request, response) => {
    //const { user } = request;
    const { todo } = request;
    const { title, deadline } = request.body;

    todo.title = title;
    todo.deadline = deadline
    
    response.status(200).send(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistTodo, (request, response) => {
    const { todo } = request;

    todo.done = true;

    response.status(200).send(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistTodo, (request, response) => {
    const { user } = request;
    const { id } = request.params;

    const task = user.todos.findIndex(todo => todo.id === id)

    if(!task) {
        response.status(204).json({error: 'Todo not found!'});
    }

    user.todos.splice(task, 1);

    return response.status(200).json(user.todos)
});

module.exports = app;