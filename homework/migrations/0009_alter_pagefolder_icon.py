# Generated by Django 3.2.5 on 2021-07-22 10:07

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('homework', '0008_auto_20210722_0955'),
    ]

    operations = [
        migrations.AlterField(
            model_name='pagefolder',
            name='icon',
            field=models.CharField(blank=True, max_length=256, null=True, verbose_name='icon'),
        ),
    ]
