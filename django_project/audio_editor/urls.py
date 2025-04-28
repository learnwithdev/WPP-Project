from django.urls import path
from .views import home
from . import views

urlpatterns = [
    path('', views.home, name='editor-home'),
    path('edit/', views.edit_view, name='edit_page'),
    path('edit/merge-append', views.merge_append, name='merge-append'),
    path('export-audio/', views.export_audio, name='export_audio'),
    path('downloads/', views.downloads_list, name='downloads_list'),
    path('delete_download/<int:audio_id>/', views.delete_download, name='delete_download'),
    path('visualize/', views.visualize, name='visualize')
]