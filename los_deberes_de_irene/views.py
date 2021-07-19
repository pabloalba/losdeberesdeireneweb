from django.views import generic

class HomeView(generic.TemplateView):
    template_name = "los_deberes_de_irene/home.html"

