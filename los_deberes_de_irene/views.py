from django.http import JsonResponse
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views import generic
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers
from homework.models import *
from django.db import IntegrityError
import json


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
