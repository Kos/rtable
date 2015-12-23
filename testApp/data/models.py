from django.db import models


class Data(models.Model):
    id = models.AutoField(primary_key=True)
    amount = models.IntegerField()
    foo = models.TextField()
    bar = models.TextField()
