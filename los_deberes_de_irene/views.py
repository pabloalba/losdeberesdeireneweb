from django.views import generic

from homework.models import *


class HomeView(generic.TemplateView):
    template_name = "los_deberes_de_irene/home.html"


class BrowserView(generic.TemplateView):
    template_name = "los_deberes_de_irene/browser.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        folders = PageFolder.objects.filter(parent=None)
        pages = Page.objects.filter(folder=None)

        context["folders"] = folders
        context["pages"] = pages

        return context

