from django.test import TestCase
from django.urls import reverse
from .models import Todo
from .forms import TodoForm
from django.contrib.auth.models import User             
from django.utils import timezone                   
from django.contrib.messages import get_messages
# Create your   


class ModelTests(TestCase):

    def setUp(self):
        self.todo = Todo.objects.create(
            title='Test Todo',
            description='Test Description',
            due_date=timezone.now(),
            is_resolved=False
        )
    def test_todo_model_str(self):
        self.assertEqual(str(self.todo), 'Test Todo')


class FormTests(TestCase):
    def test_todo_form_valid(self):
        form = TodoForm(data={'title': 'Test Todo', 'description': 'Test Description', 'due_date': '2025-01-01', 'is_resolved': False})
        self.assertTrue(form.is_valid())

    def test_todo_form_invalid(self):
        form = TodoForm(data={})
        self.assertFalse(form.is_valid())
        self.assertIn("title", form.errors)
 

class URLTests(TestCase):
    def test_todo_list_url(self):
        # Create a Todo in the test database
        Todo.objects.create(
            title='Test Todo',
            description='Test Description',
            due_date=timezone.now(),
            is_resolved=False
        )
        response = self.client.get(reverse('todos:todo_list'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'todos/todo_list.html')
        self.assertContains(response, 'Test Description')           


class ViewTests(TestCase):
    def setUp(self):
        self.todo = Todo.objects.create(title='Example Todo', description='Example Description', due_date=timezone.now(), is_resolved=False)

    def test_todo_list_view(self):
        response = self.client.get(reverse('todos:todo_list'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'todos/todo_list.html')
        self.assertContains(response, self.todo.title)

    def test_todo_create_view(self):
        response = self.client.post(reverse('todos:todo_create'), {'title': 'New Todo', 'description': 'New Description', 'due_date':'2025-12-01', 'is_resolved': False},
         follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Todo.objects.count(), 2)
        self.assertTrue(Todo.objects.filter(title='New Todo').exists())

    def test_todo_update_view(self):
        response = self.client.post(reverse('todos:todo_update', args=[self.todo.pk]), {'title': 'Updated Todo', 'description': 'Updated Description', 'due_date':'2025-12-31', 'is_resolved': True},
         follow=True)
        update_todo = Todo.objects.get(pk=self.todo.pk)
        self.assertEqual(Todo.objects.count(), 1)
        self.assertEqual(update_todo.title, 'Updated Todo')
        self.assertEqual(update_todo.due_date.strftime('%Y-%m-%d'), '2025-12-31')
        self.assertEqual(update_todo.is_resolved, True)
        self.assertContains(response, 'Updated Description') 
        self.assertRedirects(response, reverse('todos:todo_list'))
         

    def test_todo_delete_view(self):
        response = self.client.post(reverse('todos:todo_delete', args=[self.todo.pk]), follow=True)
        self.assertEqual(Todo.objects.count(), 0)
        self.assertRedirects(response, reverse('todos:todo_list'))