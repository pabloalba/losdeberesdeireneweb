# Generated by Django 3.2.5 on 2021-07-23 09:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('homework', '0012_auto_20210723_0952'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='selected_font',
            field=models.CharField(default='kid', max_length=10, verbose_name='Fuente'),
        ),
    ]
