import os

from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.views import LoginView
from django.core.files.base import ContentFile, File
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.mail import send_mail
from django.http import JsonResponse
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views import generic
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers

from homework.forms import ImageForm, PDFForm
from homework.models import *
from django.db import IntegrityError

from . import settings
from .forms import NewUserForm, LoginForm
from django.contrib import messages, auth
from django.shortcuts import render, redirect
from pdf2image import convert_from_bytes
import json
import random
from io import StringIO
from io import BytesIO
from django.templatetags.static import static


class RegisterView(generic.FormView):
    template_name = "los_deberes_de_irene/register.html"
    form_class = NewUserForm
    success_url = "/"

    def form_valid(self, form):
        user = form.save()
        login(self.request, user)
        is_teacher = "teacher" == form.cleaned_data.get("user_type")
        profile = Profile.objects.create(owner=user,
                                         code=_generate_code(),
                                         is_teacher=is_teacher,
                                         full_name=form.cleaned_data.get("full_name"))
        if not is_teacher:
            profile.root_folder = PageFolder.objects.create(name="root", owner=user)
            profile.save()

        return super().form_valid(form)


class LoginView(LoginView):
    template_name = "los_deberes_de_irene/login.html"
    authentication_form = LoginForm

    def get_success_url(self):
        url = self.get_redirect_url()
        return url or "/"


class LogoutView(generic.View):
    def get(self, request):
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

        return context


class PageView(generic.TemplateView):
    template_name = "los_deberes_de_irene/page.html"
    page = None

    def get(self, request, page_id):
        self.page = _get_valid_page(request.user, page_id)
        return super().get(request)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        back_folder = self.page.folder.id
        labels = Label.objects.filter(page=self.page)
        lines = Line.objects.filter(page=self.page)

        context["page"] = self.page
        context["back_folder"] = back_folder
        context["labels"] = labels
        context["lines"] = lines

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

        context["tab"] = self.request.session.get("tab") if self.request.session.get("tab") else "teachers"
        self.request.session["tab"] = None

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
        context["tab"] = self.request.session.get("tab") if self.request.session.get("tab") else "teachers"
        self.request.session["tab"] = None

        form = PasswordChangeForm(self.request.user)
        context["form"] = form

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


class DeleteFolderView(generic.View):
    def get(self, request, folder_id):
        folder = _get_valid_folder(request.user, folder_id)
        if not folder or folder_id == folder.owner.profile.root_folder.id:
            return redirect("home")
        parent_id = folder.parent.id
        folder.delete()
        return redirect("browser", folder_id=parent_id)


class DeletePageView(generic.View):
    def get(self, request, page_id):
        page = _get_valid_page(request.user, page_id)
        parent_id = page.folder.id
        page.delete()
        return redirect("browser", folder_id=parent_id)


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


@method_decorator(csrf_exempt, name="dispatch")
class EditLineView(generic.View):
    def post(self, request, page_id, line_id):
        body = json.loads(request.body.decode("utf-8"))
        try:
            line = Line.objects.get(pk=line_id)
            if len(body["color"]) > 0:
                line.color = body["color"]
                line.save()
            else:
                line.delete()
            return JsonResponse("", safe=False)
        except Line.DoesNotExist as e:
            return HttpResponse(status=404)


@method_decorator(csrf_exempt, name="dispatch")
class LineView(generic.View):
    def get(self, request, page_id):
        lines = Line.objects.filter(page_id=page_id)
        raw_data = serializers.serialize("python", lines)
        actual_data = [d["fields"] for d in raw_data]
        return JsonResponse(actual_data, safe=False)

    def post(self, request, page_id):
        body = json.loads(request.body.decode("utf-8"))
        try:
            body["page_id"] = page_id
            newrecord = Line.objects.create(**body)
            # Turn the object to json to dict, put in array to avoid non-iterable error
            data = json.loads(serializers.serialize("json", [newrecord]))
            # send json response with new object
            return JsonResponse(data, safe=False)
        except IntegrityError as e:
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
        page_folder = _get_valid_folder(request.user, request.POST.get("current_folder"))
        if not page_folder:
            return redirect("home")

        page_folder.name = request.POST.get("name")
        page_folder.icon = request.POST.get("folder_icon")
        page_folder.save()
        return redirect("browser", folder_id=request.POST.get("parent_folder"))


class UpdatePageView(generic.View):
    def post(self, request):
        page = _get_valid_page(request.user, request.POST.get("current_page"))
        page.name = request.POST.get("name")
        page.save()
        return redirect("browser", folder_id=request.POST.get("parent_folder"))


class RenameAllView(generic.View):
    def post(self, request):
        self.page_folder = _get_valid_folder(request.user, request.POST.get("parent_folder"))
        if not self.page_folder:
            return redirect("home")

        number = int(request.POST.get("number"))
        pages = Page.objects.filter(folder=self.page_folder).order_by('name')
        num_size = max(3, len(str(number + len(pages))))
        for page in pages:
            page.name = request.POST.get("name") + ' ' + str(number).zfill(num_size)
            page.save()
            number += 1
        return redirect("browser", folder_id=request.POST.get("parent_folder"))


class AddPageView(generic.View):

    def post(self, request):
        page_folder = _get_valid_folder(request.user, request.POST.get("parent_folder"))
        if not page_folder:
            return redirect("home")
        form = ImageForm(request.POST, request.FILES)
        if form.is_valid():
            name = self._get_name(request.POST.get("name"), form.cleaned_data.get("image"))
            Page.objects.create(
                name=name,
                owner=page_folder.owner,
                folder=page_folder,
                image=form.cleaned_data.get("image"))
        else:
            form = PDFForm(request.POST, request.FILES)
            if form.is_valid():
                file = form.cleaned_data.get("image")
                name = self._get_name(request.POST.get("name"), file)
                with file.open() as f:
                    images = convert_from_bytes(f.read())
                    if len(images) > 1:
                        icon_url = static('img/subjects/folder.png')
                        page_folder = PageFolder.objects.create(name=name,
                                                                owner=page_folder.owner,
                                                                parent=page_folder,
                                                                icon=icon_url)
                    for i in range(len(images)):
                        image_name = name + '_' + str(i).zfill(2)
                        self._create_page(image_name, images[i], page_folder)

        return redirect("browser", folder_id=request.POST.get("parent_folder"))

    def _get_name(self, name, image):
        if not name:
            return image.name.rsplit(".", 1)[0]
        return name

    def _create_page(self, name, image, page_folder):
        page = Page(name=name, owner=page_folder.owner, folder=page_folder)
        blob = BytesIO()
        image.save(blob, 'JPEG')
        page.image.save(name + '.jpg', File(blob))
        page.save()
        return


class FontView(generic.View):

    def post(self, request):
        if _is_teacher(self.request.user):
            return redirect("teacher")

        selected_font = request.POST.get("selected_font")
        if "kid" == selected_font or "adult" == selected_font or "dyslexia" == selected_font:
            self.request.user.profile.selected_font = selected_font
            self.request.user.profile.save()

        request.session["tab"] = "font"
        if self.request.user.profile.is_teacher:
            return redirect("teacher")
        else:
            return redirect("student")


class UpdateProfileView(generic.View):

    def post(self, request):
        request.user.profile.full_name = request.POST.get("full_name")
        request.user.email = request.POST.get("email")
        request.user.username = request.POST.get("email")
        request.user.save()
        request.user.profile.save()
        request.session["tab"] = "profile"
        return redirect("student")


class UpdatePasswordView(generic.View):

    def post(self, request):
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)  # Important!
            messages.success(request, 'Contraseña cambiada :)')
        else:
            messages.error(request, 'No se ha podido cambiar la contraseña :(')
        request.session["tab"] = "password"
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


def _get_valid_page(user, page_id):
    page = Page.objects.filter(pk=page_id).first()
    if not page:
        return redirect("home")

    if _is_teacher(user):
        # Only allow view folders of its students
        if StudentTeacher.objects.filter(teacher=user, student=page.owner).count() == 0:
            return redirect("home")
    else:
        if page.owner != user:
            return redirect("home")

    return page


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


def _send_email(to, subject, message):
    send_mail(
        subject,
        message,
        'noreply@losdeberesdeirene.tk',
        [to],
        fail_silently=False,
    )
