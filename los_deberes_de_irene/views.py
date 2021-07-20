from django.contrib.auth import authenticate, login
from django.contrib.auth.forms import AuthenticationForm
from django.http import JsonResponse
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views import generic
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers
from homework.models import *
from django.db import IntegrityError
from .forms import NewUserForm
from django.contrib import messages
from django.shortcuts import render, redirect
import json


def register_request(request):
    if request.method == "POST":
        form = NewUserForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Registration successful.")
            return redirect("home")
        messages.error(request, "Unsuccessful registration. Invalid information.")
    form = NewUserForm()
    return render(request=request, template_name="los_deberes_de_irene/register.html", context={"register_form": form})


def login_request(request):
    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            print(username)
            print(password)
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.info(request, f"You are now logged in as {username}.")
                return redirect("home")
            else:
                messages.error(request, "Invalid username or password.")
        else:
            messages.error(request, "Invalid username or password.")
    form = AuthenticationForm()
    return render(request=request, template_name="los_deberes_de_irene/login.html", context={"login_form": form})


class HomeView(generic.TemplateView):
    template_name = "los_deberes_de_irene/home.html"


class BrowserView(generic.TemplateView):
    template_name = "los_deberes_de_irene/browser.html"

    def get_context_data(self, folder_id=None, **kwargs):
        context = super().get_context_data(**kwargs)

        if folder_id:
            parent_folder = PageFolder.objects.get(pk=folder_id)
        else:
            parent_folder = None

        folders = PageFolder.objects.filter(parent=folder_id)
        pages = Page.objects.filter(folder=folder_id)

        if parent_folder and parent_folder.parent:
            back_folder = parent_folder.parent.id
        else:
            back_folder = None

        context["big_grid"] = (len(folders) + len(pages) <= 2)
        context["parent_folder"] = parent_folder
        context["back_folder"] = back_folder
        context["folders"] = folders
        context["pages"] = pages

        return context


@method_decorator(csrf_exempt, name='dispatch')
class LabelView(generic.View):
    def get(self, request, page_id):
        labels = Label.objects.filter(page_id=page_id)
        raw_data = serializers.serialize('python', labels)
        actual_data = [d['fields'] for d in raw_data]
        return JsonResponse(actual_data, safe=False)

    def post(self, request, page_id):
        body = json.loads(request.body.decode("utf-8"))
        body['page_id'] = page_id
        try:
            newrecord = Label.objects.create(**body)
            # Turn the object to json to dict, put in array to avoid non-iterable error
            data = json.loads(serializers.serialize('json', [newrecord]))
            # send json response with new object
            return JsonResponse(data, safe=False)
        except IntegrityError as e:
            return HttpResponse(status=404)
