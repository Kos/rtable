import string
import random
from rest_framework import views, serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.template.response import HttpResponse, TemplateResponse


def default_view(request):
    return TemplateResponse(request, 'default_view.html')


@api_view(['GET'])
def data(request):
    rng = random.Random(23123)
    data = [randomRow(rng) for _ in xrange(20)]
    return Response(data)


def randomRow(rng):
    return {
        'id': rng.randint(0, 1000),
        'foo': randomWord(rng),
        'bar': randomWord(rng),
    }


def randomWord(rng):
    return ''.join(rng.choice(string.letters) for _ in xrange(rng.randint(5, 20))).title()
