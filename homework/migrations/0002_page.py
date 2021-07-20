# Generated by Django 3.2.5 on 2021-07-19 14:25

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('homework', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Page',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='nombre')),
                ('image', models.ImageField(upload_to='', verbose_name='imagen')),
                ('folder', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='homework.pagefolder', verbose_name='carpeta')),
            ],
            options={
                'verbose_name': 'Página',
                'verbose_name_plural': 'Páginas',
                'ordering': ['folder__name', 'name'],
            },
        ),
    ]