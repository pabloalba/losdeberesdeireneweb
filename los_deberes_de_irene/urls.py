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
from django.urls import path

from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    url('', include('pwa.urls')),
    url(r"^$", views.HomeView.as_view(), name='home'),
    url(r"^browser/(?P<folder_id>\d+)", views.BrowserView.as_view(), name='browser'),
    url(r"^browser$", views.BrowserView.as_view(), name='browser'),
    url(r"browser", views.BrowserView.as_view(), name='browser'),
    path('pages/<int:page_id>/labels/', views.LabelView.as_view(), name='labels'),
    path("register", views.register_request, name="register"),
    path("login", views.login_request, name="login")
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
