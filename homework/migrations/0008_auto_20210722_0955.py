# Generated by Django 3.2.5 on 2021-07-22 07:55

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('homework', '0007_auto_20210721_1057'),
    ]

    operations = [
        migrations.AddField(
            model_name='page',
            name='owner',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to='auth.user', verbose_name='owner'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='pagefolder',
            name='owner',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to='auth.user', verbose_name='owner'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='profile',
            name='root_folder',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='homework.pagefolder', verbose_name='carpeta raiz'),
        ),
        migrations.AlterField(
            model_name='pagefolder',
            name='icon',
            field=models.ImageField(null=True, upload_to='', verbose_name='icono'),
        ),
    ]
