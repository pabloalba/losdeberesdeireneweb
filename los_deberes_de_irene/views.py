from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.http import JsonResponse
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views import generic
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers

from homework.forms import ImageForm
from homework.models import *
from django.db import IntegrityError
from .forms import NewUserForm
from django.contrib import messages, auth
from django.shortcuts import render, redirect
import json
import random


def register_request(request):
    if request.method == "POST":
        form = NewUserForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            is_teacher = "teacher" == form.cleaned_data.get("user_type")
            profile = Profile.objects.create(owner=user,
                                             code=_generate_code(),
                                             is_teacher=is_teacher,
                                             full_name=form.cleaned_data.get("full_name"))
            if is_teacher:
                return redirect("teacher")
            else:
                profile.root_folder = PageFolder.objects.create(name="root", owner=user)
                profile.save()
                return redirect("home")
        messages.error(request, "Unsuccessful registration. Invalid information.")
    form = NewUserForm()
    return render(request=request, template_name="los_deberes_de_irene/register.html", context={"register_form": form})


def login_request(request):
    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get("username")
            password = form.cleaned_data.get("password")
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                if _is_teacher(user):
                    return redirect("teacher")
                else:
                    return redirect("home")
            else:
                messages.error(request, "Invalid username or password.")
        else:
            messages.error(request, "Invalid username or password.")
    form = AuthenticationForm()
    return render(request=request, template_name="los_deberes_de_irene/login.html", context={"login_form": form})


def logout_request(request):
    logout(request)
    return redirect("home")


class HomeView(generic.View):
    def get(self, request):
        if _is_teacher(request.user):
            return redirect("teacher")
        else:
            return redirect("browser", folder_id=request.user.profile.root_folder.id)

        return super().get(request)



class BrowserView(generic.TemplateView):
    template_name = "los_deberes_de_irene/browser.html"
    page_folder = None

    def get(self, request, folder_id):
        self.page_folder = _get_valid_folder(request.user, folder_id)
        if not self.page_folder:
            return redirect("home")

        return super().get(request)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        folders = PageFolder.objects.filter(parent=self.page_folder)

        pages = Page.objects.filter(folder=self.page_folder)

        if self.page_folder.parent:
            back_folder = self.page_folder.parent.id
        else:
            back_folder = None

        num = len(folders) + len(pages)
        empties = []
        if num > 4:
            while num % 4 != 0:
                empties.append(None)
                num += 1

        context["big_grid"] = (len(folders) + len(pages) <= 2)
        context["medium_grid"] = (len(folders) + len(pages) > 2) and (len(folders) + len(pages) <= 6)
        context["parent_folder"] = self.page_folder
        context["back_folder"] = back_folder
        context["empties"] = empties
        context["pages"] = pages
        context["folders"] = folders
        context["items"] = list(folders) + list(pages)
        print(context["items"])

        return context


class PageView(generic.TemplateView):
    template_name = "los_deberes_de_irene/page.html"
    page = None

    def get(self, request, page_id):
        self.page = Page.objects.filter(pk=page_id).first()
        if not self.page:
            return redirect("home")

        if _is_teacher(request.user):
            # Only allow view folders of its students
            if StudentTeacher.objects.filter(teacher=request.user, student=self.page.owner).count() == 0:
                return redirect("home")
        else:
            if self.page.owner != request.user:
                return redirect("home")

        return super().get(request)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs
                                           )
        back_folder = self.page.folder.id
        labels = Label.objects.filter(page=self.page)

        context["page"] = self.page
        context["back_folder"] = back_folder
        context["labels"] = labels

        return context


class TeacherView(generic.TemplateView):
    template_name = "los_deberes_de_irene/teacher.html"

    def get(self, request):
        if not _is_teacher(self.request.user):
            return redirect("home")
        return super().get(request)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        student_teachers = StudentTeacher.objects.filter(teacher=self.request.user).all()
        students = [st.student for st in student_teachers]

        profile = Profile.objects.filter(owner=self.request.user).first()
        context["code"] = profile.code
        context["students_list"] = students

        return context


class StudentView(generic.TemplateView):
    template_name = "los_deberes_de_irene/student.html"

    def get(self, request):
        if _is_teacher(self.request.user):
            return redirect("home")
        return super().get(request)

    def post(self, request):
        if _is_teacher(self.request.user):
            return redirect("home")
        code = request.POST.get("code")
        if code:
            profile = Profile.objects.filter(code=code).first()
            if profile and _is_teacher(profile.owner):
                if StudentTeacher.objects.filter(student=self.request.user, teacher=profile.owner).count() == 0:
                    StudentTeacher.objects.create(student=self.request.user, teacher=profile.owner)

        return super().get(request)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        student_teachers = StudentTeacher.objects.filter(student=self.request.user).all()
        teachers = [st.teacher for st in student_teachers]

        context["teachers_list"] = teachers
        context["tab"] = self.request.session.get("tab")
        self.request.session["tab"] = None

        return context


class StudentTeacherView(generic.View):
    def get(self, request):
        if _is_teacher(self.request.user):
            student_teacher = StudentTeacher.objects.filter(student=request.GET.get("student"),
                                                            teacher=self.request.user).first()
            if student_teacher:
                student_teacher.delete()
            return redirect("teacher")
        else:
            student_teacher = StudentTeacher.objects.filter(student=self.request.user,
                                                            teacher=request.GET.get("teacher")).first()
            if student_teacher:
                student_teacher.delete()
            return redirect("student")


@method_decorator(csrf_exempt, name="dispatch")
class LabelView(generic.View):
    def get(self, request, page_id):
        labels = Label.objects.filter(page_id=page_id)
        raw_data = serializers.serialize("python", labels)
        actual_data = [d["fields"] for d in raw_data]
        return JsonResponse(actual_data, safe=False)

    def post(self, request, page_id):
        body = json.loads(request.body.decode("utf-8"))
        try:
            body["page_id"] = page_id
            newrecord = Label.objects.create(**body)
            # Turn the object to json to dict, put in array to avoid non-iterable error
            data = json.loads(serializers.serialize("json", [newrecord]))
            # send json response with new object
            return JsonResponse(data, safe=False)
        except IntegrityError as e:
            return HttpResponse(status=404)


@method_decorator(csrf_exempt, name="dispatch")
class EditLabelView(generic.View):
    def post(self, request, page_id, label_id):
        body = json.loads(request.body.decode("utf-8"))
        try:
            label = Label.objects.get(pk=label_id)
            if len(body["text"]) > 0:
                label.text = body["text"]
                label.save()
            else:
                label.delete()
            return JsonResponse("", safe=False)
        except Label.DoesNotExist as e:
            return HttpResponse(status=404)


class AddFolderView(generic.View):

    def post(self, request):
        page_folder = _get_valid_folder(request.user, request.POST.get("parent_folder"))
        if not page_folder:
            return redirect("home")

        PageFolder.objects.create(name=request.POST.get("name"),
                                  owner=page_folder.owner,
                                  parent=page_folder,
                                  icon=request.POST.get("folder_icon"))
        return redirect("browser", folder_id=request.POST.get("parent_folder"))


class UpdateFolderView(generic.View):

    def post(self, request):
        page_folder = _get_valid_folder(request.user, request.POST.get("parent_folder"))
        if not page_folder:
            return redirect("home")

        page_folder.name = request.POST.get("name")
        page_folder.icon = request.POST.get("folder_icon")
        page_folder.save()
        return redirect("browser", folder_id=request.POST.get("parent_folder"))

class AddPageView(generic.View):

    def post(self, request):
        page_folder = _get_valid_folder(request.user, request.POST.get("parent_folder"))
        if not page_folder:
            return redirect("home")
        form = ImageForm(request.POST, request.FILES)
        if form.is_valid():
            name = request.POST.get("name")
            if not name:
                name = form.cleaned_data.get("image").name
                name = name.rsplit(".", 1)[0]
            Page.objects.create(
                name=name,
                owner=page_folder.owner,
                folder=page_folder,
                image=form.cleaned_data.get("image"))
        return redirect("browser", folder_id=request.POST.get("parent_folder"))


class SettingsView(generic.View):

    def post(self, request):
        if _is_teacher(self.request.user):
            return redirect("teacher")

        selected_font = request.POST.get("selected_font")
        if "kid" == selected_font or "adult" == selected_font:
            self.request.user.profile.selected_font = selected_font
            self.request.user.profile.save()

        request.session["tab"] = "settings"
        return redirect("student")

def _get_valid_folder(user, folder_id):
    page_folder = PageFolder.objects.filter(pk=folder_id).first()
    if not page_folder:
        return redirect("home")

    if _is_teacher(user):
        # Only allow view folders of its students
        if StudentTeacher.objects.filter(teacher=user, student=page_folder.owner).count() == 0:
            return None
    else:
        if page_folder.owner != user:
            return None

    return page_folder

def _generate_code():
    characters = ["c", "d", "e", "f", "h", "j", "k", "m", "n", "p", "r", "t", "v", "w", "x", "y", "2", "3", "4", "5",
                  "6", "9"]
    ok = False
    while not ok:
        code = ""
        while len(code) < 5:
            code += random.choice(characters)
        ok = Profile.objects.filter(code=code).count() == 0

    return code


def _is_teacher(user):
    return user.profile.is_teacher
