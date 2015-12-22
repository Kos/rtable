import string
import random
from rest_framework import views, serializers, generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.template.response import HttpResponse, TemplateResponse


def default_view(request):
    return TemplateResponse(request, 'default_view.html')


class DataSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    foo = serializers.CharField()
    bar = serializers.CharField()


class DataList(generics.ListAPIView):

    pretty_name = 'SessionList'
    serializer_class = DataSerializer
    paginate_by = 20

    def get_queryset(self):
        rng = random.Random(23123)
        return [randomObject(rng) for _ in xrange(20)]


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
