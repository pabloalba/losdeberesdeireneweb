# Generated by Django 3.2.5 on 2021-07-20 07:01

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('homework', '0003_pagefolder_parent'),
    ]

    operations = [
        migrations.CreateModel(
            name='Label',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField(verbose_name='texto')),
                ('x', models.PositiveSmallIntegerField(verbose_name='x')),
                ('y', models.PositiveSmallIntegerField(verbose_name='y')),
                ('color', models.CharField(max_length=7, verbose_name='color')),
                ('font_name', models.CharField(max_length=100, verbose_name='fuente')),
                ('font_size', models.PositiveSmallIntegerField(verbose_name='tamaño de fuente')),
                ('page', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='homework.page', verbose_name='página')),
            ],
            options={
                'verbose_name': 'Etiqueta',
                'verbose_name_plural': 'Etiquetas',
                'ordering': ['page__id', 'y', 'x'],
            },
        ),
    ]
