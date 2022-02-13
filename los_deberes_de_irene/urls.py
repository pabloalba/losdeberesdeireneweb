"""los_deberes_de_irene URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.conf import settings
from django.conf.urls import url, include
from django.conf.urls.static import static
from django.contrib.auth.decorators import login_required
from django.urls import path

from . import views

urlpatterns = [
    url('', include('pwa.urls')),
    path('admin/', admin.site.urls),
    path("", login_required(views.HomeView.as_view()), name='home'),
    path("browser/<int:folder_id>", login_required(views.BrowserView.as_view()), name='browser'),
    path("add_folder", login_required(views.AddFolderView.as_view()), name='add_folder'),
    path("update_folder", login_required(views.UpdateFolderView.as_view()), name='update_folder'),
    path("add_page", login_required(views.AddPageView.as_view()), name='add_page'),
    path("update_page", login_required(views.UpdatePageView.as_view()), name='update_page'),
    path("teacher", login_required(views.TeacherView.as_view()), name='teacher'),
    path("student", login_required(views.StudentView.as_view()), name='student'),
    path("delete_student_teacher", login_required(views.StudentTeacherView.as_view()), name='delete_student_teacher'),
    path("pages/<int:page_id>", login_required(views.PageView.as_view()), name='page'),
    path('pages/<int:page_id>/labels', login_required(views.LabelView.as_view()), name='labels'),
    path('pages/<int:page_id>/labels/<int:label_id>', login_required(views.EditLabelView.as_view()), name='edit-label'),
    path('pages/<int:page_id>/lines', login_required(views.LineView.as_view()), name='lines'),
    path('pages/<int:page_id>/lines/<int:line_id>', login_required(views.EditLineView.as_view()), name='edit-line'),
    path("delete_folder/<int:folder_id>", login_required(views.DeleteFolderView.as_view()), name='delete_folder'),
    path("delete_page/<int:page_id>", login_required(views.DeletePageView.as_view()), name='delete_page'),
    path("font", login_required(views.FontView.as_view()), name='font'),
    path("update_profile", login_required(views.UpdateProfileView.as_view()), name='update_profile'),
    path("update_password", login_required(views.UpdatePasswordView.as_view()), name='update_password'),
    path("register", views.RegisterView.as_view(), name="register"),
    path("login", views.LoginView.as_view(), name="login"),
    path("logout", views.LogoutView.as_view(), name="logout"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
