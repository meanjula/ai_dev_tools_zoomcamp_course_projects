## Q.1 : Answer

- using uv to manage virtual environment:

```bash

python3 -m venv venv
source .venv/bin/activate   # macOS/Linux
uv pip install django

```
## Q.2 : Answer

Need to Edit settings.py 

Add todos inside INSTALLED_APPS that install the todos app in the project.


## Q.3 : Answer

We need Todo Model for this Todo App


## Q.4 : Answer

We put views.py, urls.py, admin.py and tests.py inside todos (app level)

├── todo_project/
├── todos/
│   ├── models.py 
│   ├── views.py 
│   ├── admin.py 
│   ├── urls.py
│   ├── tests.py


## Q.5 : Answer
