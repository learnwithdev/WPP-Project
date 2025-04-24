from django.urls import path
from .views import home
from . import views

urlpatterns = [
    path('', views.home, name='editor-home'),
    path('edit/', views.edit_view, name='edit_page'),
    path('edit/merge-append', views.merge_append, name='merge-append'),
    path('export-audio/', views.export_audio, name='export_audio'),
    path('downloads/', views.user_downloads, name='user_downloads'),
]