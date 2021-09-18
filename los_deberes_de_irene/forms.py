from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User



class NewUserForm(UserCreationForm):
    user_type = forms.CharField(required=True)
    full_name = forms.CharField(required=True)

    class Meta:
        model = User
        fields = ('username', 'password1', 'password2')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['full_name'].widget.attrs['autofocus'] = True
        self.fields['full_name'].widget.attrs['placeholder'] = 'Introducir nombre y apellidos'
        self.fields['username'].widget = forms.EmailInput(
            attrs={'placeholder': 'Introducir email de usuario'}
        )
        self.fields['password1'].widget.attrs['placeholder'] = 'De al menos 8 caracteres'
        self.fields['password2'].widget.attrs['placeholder'] = 'De al menos 8 caracteres'

    def save(self, commit=True):
        user = super(NewUserForm, self).save(commit=False)
        user.email = self.cleaned_data['username']
        if commit:
            user.save()
        return user


class LoginForm(AuthenticationForm):
    username = forms.EmailField(
        widget=forms.EmailInput(
            attrs={'autofocus': True,
                   'placeholder': 'Introducir email de usuario'}
        )
    )
    password = forms.CharField(
        strip=False,
        widget=forms.PasswordInput(
            attrs={'autocomplete': 'current-password',
                   'placeholder': 'De al menos 8 caracteres'}
        )
    )

