from django.urls import path
from .views import home
from . import views

urlpatterns = [
    path('', views.home, name='editor-home'),
    path('edit/', views.edit_view, name='edit_page'),
    path('edit/merge-append', views.merge_append, name='merge-append'),
]