# Generated by Django 3.2.5 on 2021-07-19 13:58

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='PageFolder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='nombre')),
                ('icon', models.ImageField(upload_to='', verbose_name='icono')),
            ],
            options={
                'verbose_name': 'Carpeta de páginas',
                'verbose_name_plural': 'Carpetas de páginas',
                'ordering': ['name'],
            },
        ),
    ]
