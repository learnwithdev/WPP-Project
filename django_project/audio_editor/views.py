from django.shortcuts import render
from django.shortcuts import render 

# Create your views here.
def home(request):
    return render(request, 'audio_editor/main.html')

def edit_view(request):
    return render(request, 'audio_editor/trimWorking.html')