from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
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

# @login_required
# def user_downloads(request):
#     downloads = AudioDownload.objects.filter(user=request.user).order_by('-created_at')
#     return render(request, 'audio_editor/downloads.html', {'downloads': downloads})

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_download(request, audio_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        audio = AudioDownload.objects.get(id=audio_id, user=request.user)
        # Delete the file from the filesystem
        if os.path.exists(audio.file_path.path):
            os.remove(audio.file_path.path)
        # Delete the database record
        audio.delete()
        return JsonResponse({"status": "success"}, status=200)
    except AudioDownload.DoesNotExist:
        return JsonResponse({"error": "Audio not found or not owned by user"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@login_required
def downloads_list(request):
    downloads = AudioDownload.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'audio_editor/downloads.html', {'downloads': downloads})

