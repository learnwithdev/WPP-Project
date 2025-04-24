from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm

class UserRegisterForm(UserCreationForm):
    email = forms.EmailField() #required=False/True to make it optional

    class Meta:
        model=User
        fields = ['username', 'email', 'password1', 'password2']

class LoginForm(forms.Form):
    username = forms.CharField(
        max_length=150,
        required=True,
        widget=forms.TextInput(attrs={'required': 'true'})
    )
    password = forms.CharField(
        required=True,
        widget=forms.PasswordInput(attrs={'required': 'true'})
    )
    captcha = forms.CharField(
        max_length=5,
        required=True,
        widget=forms.TextInput(attrs={'id': 'captchaInput', 'required': 'true'})
    )

# class UserUpdateForm(forms.ModelForm):
#     email=forms.EmailField()

#     class Meta:
#         model = User
#         fields = ['username', 'email']

# class ProfileUpdateForm(forms.ModelForm):
#     class Meta:
#         model = Profile
#         fields = ['image']