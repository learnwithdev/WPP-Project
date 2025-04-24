from django.shortcuts import render
from django.http import JsonResponse
from .models import AudioDownload
from django.core.files.base import ContentFile
from django.contrib.auth.decorators import login_required
import os
from django.conf import settings

# Create your views here.

def home(request):
    return render(request, 'audio_editor/main.html')

def edit_view(request):
    return render(request, 'audio_editor/trimWorking.html')

def merge_append(request):
    return render(request, 'audio_editor/merge_append.html')

def export_audio(request):
    if request.method == 'POST' and request.user.is_authenticated:
        file_data = request.FILES.get('audio_file')
        file_name = file_data.name
        if file_data:
            audio = AudioDownload(user=request.user, file_name=file_name)
            audio.file_path.save(file_name, ContentFile(file_data.read()))
            audio.save()
            return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'fail'}, status=400)

@login_required
def user_downloads(request):
    downloads = AudioDownload.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'audio_editor/downloads.html', {'downloads': downloads})
