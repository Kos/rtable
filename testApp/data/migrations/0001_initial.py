# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Data',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True)),
                ('amount', models.IntegerField()),
                ('foo', models.TextField()),
                ('bar', models.TextField()),
            ],
        ),
    ]
