from django import forms


class ImageForm(forms.Form):
    image = forms.ImageField(required=True)


class PDFForm(forms.Form):
    image = forms.FileField(required=True)
