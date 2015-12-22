import string
import random
from rest_framework import serializers, generics, pagination
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.template.response import TemplateResponse


def default_view(request):
    return TemplateResponse(request, 'default_view.html')


class DataSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    foo = serializers.CharField()
    bar = serializers.CharField()


class DataPagination(pagination.PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 1000


class DataList(generics.ListAPIView):
    serializer_class = DataSerializer
    pagination_class = DataPagination

    def get_queryset(self):
        rng = random.Random(23123)
        return [randomObject(rng) for _ in xrange(45)]


@api_view(['GET'])
def data(request):
    return Response(data)


class Model(object):
    pass


def randomObject(rng):
    m = Model()
    m.id = rng.randint(0, 1000)
    m.foo = randomWord(rng)
    m.bar = randomWord(rng)
    return m


def randomWord(rng):
    return ''.join(rng.choice(string.letters) for _ in xrange(rng.randint(5, 20))).title()
