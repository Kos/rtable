from .models import Data
from django.template.response import TemplateResponse
from rest_framework import serializers, generics, pagination, filters
import django_filters
import random
import string


def default_view(request):
    return TemplateResponse(request, 'default_view.html')


class DataSerializer(serializers.ModelSerializer):
    class Meta:
        model = Data


class DataPagination(pagination.PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 1000


class DataFilter(django_filters.FilterSet):
    foo = django_filters.CharFilter(lookup_type='istartswith')

    class Meta:
        model = Data
        fields = ['foo', 'bar']


class DataList(generics.ListAPIView):
    serializer_class = DataSerializer
    pagination_class = DataPagination
    filter_backends = (filters.DjangoFilterBackend, filters.OrderingFilter,)
    filter_class = DataFilter

    def get_queryset(self):
        if not Data.objects.exists():
            create_fake_data(random.Random(23123), 45)
        return Data.objects.all()


def create_fake_data(rng, n):
    for _ in xrange(n):
        randomObject(rng).save()


def randomObject(rng):
    m = Data()
    m.amount = rng.randint(0, 1000)
    m.foo = randomWord(rng)
    m.bar = rng.choice(['red', 'blue', 'green', 'greenish', 'cyan', 'magenta', 'yellow', 'beige', 'baige'])
    return m


def randomWord(rng):
    return ''.join(rng.choice(string.letters) for _ in xrange(rng.randint(5, 20))).title()
