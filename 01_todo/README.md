# Django Todo App

A simple and elegant Todo application built with Django that allows you to create, manage, and track your tasks.

## Features

- ✅ Create new todos with title, description, and due date
- ✅ Edit existing todos
- ✅ Delete todos
- ✅ Mark todos as resolved/unresolved
- ✅ View all todos in a clean, organized list
- ✅ Responsive design with Bootstrap 5
- ✅ Django Admin panel integration
- ✅ Beautiful and modern UI

## Technologies Used

- **Django 4.2.16** - Web framework
- **Python 3.9+** - Programming language
- **Bootstrap 5** - Frontend framework
- **SQLite** - Database (default)

## Project Structure

```
Django_ToDo/
├── manage.py
├── requirements.txt
├── README.md
├── todo_project/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
└── todos/
    ├── __init__.py
    ├── admin.py
    ├── apps.py
    ├── forms.py
    ├── models.py
    ├── views.py
    ├── urls.py
    ├── tests.py
    ├── migrations/
    │   └── __init__.py
    ├── static/
    │   └── todos/
    │       ├── css/
    │       │   └── style.css
    │       └── js/
    │           └── main.js
    └── templates/
        ├── base.html
        └── todos/
            ├── todo_list.html
            └── todo_form.html
```

## Installation

### Prerequisites

- Python 3.9 or higher
- pip (Python package installer)

### Steps

1. **Clone or navigate to the project directory:**
   ```bash
   cd /projectfolder
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   Or if using Python 3:
   ```bash
   python3 -m pip install -r requirements.txt
   ```

3. **Run migrations:**
   ```bash
   python3 manage.py makemigrations
   python3 manage.py migrate
   ```

4. **Create a superuser (optional, for admin panel):**
   ```bash
   python3 manage.py createsuperuser
   ```
   Follow the prompts to create an admin user.

5. **Start the development server:**
   ```bash
   python3 manage.py runserver
   ```

6. **Access the application:**
   - Main app: http://127.0.0.1:8000/
   - Admin panel: http://127.0.0.1:8000/admin/

## Usage

### Creating a Todo

1. Click on "Create Todo" button in the navigation bar or on the home page
2. Fill in the form:
   - **Title** (required): Enter a title for your todo
   - **Description** (optional): Add details about the task
   - **Due Date** (optional): Set a deadline
3. Click "Create Todo" to save

### Editing a Todo

1. Click the "Edit" button on any todo card
2. Modify the fields as needed
3. Click "Update Todo" to save changes

### Marking as Resolved

1. Click the "Mark Resolved" button on any todo
2. The todo will be marked as resolved and displayed with a green border
3. Click "Mark Unresolved" to change it back

### Deleting a Todo

1. Click the "Delete" button on any todo
2. Confirm the deletion in the popup dialog
3. The todo will be permanently removed

## Models

### Todo Model

- `title` - CharField (max 200 characters, required)
- `description` - TextField (optional)
- `due_date` - DateTimeField (optional)
- `is_resolved` - BooleanField (default: False)
- `created_at` - DateTimeField (auto-generated)
- `updated_at` - DateTimeField (auto-updated)

## URLs

- `/` - Todo list (home page)
- `/create/` - Create new todo
- `/<id>/edit/` - Edit todo
- `/<id>/delete/` - Delete todo
- `/<id>/toggle/` - Toggle resolved status
- `/admin/` - Django admin panel

## Development

### Running Tests

```bash
python3 manage.py test
```

### Collecting Static Files (for production)

```bash
python3 manage.py collectstatic
```

## Requirements

See `requirements.txt` for the complete list of dependencies:

- Django==4.2.16
- asgiref==3.7.2
- sqlparse==0.4.4

## Notes

- The app uses SQLite database by default (created as `db.sqlite3` after migrations)
- Static files are automatically served in development mode
- For production deployment, configure `STATIC_ROOT` in settings.py

## License

This project is open source and available for educational purposes.

## Author

Created as a Django learning project.

---

**Happy Todo Managing! 🎉**

