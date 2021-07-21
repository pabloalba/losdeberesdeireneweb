from django.contrib.auth.models import User
from django.db import models


class PageFolder(models.Model):
    parent = models.ForeignKey(
        "PageFolder",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        verbose_name="carpeta padre"
    )
    name = models.CharField(
        blank=False,
        null=False,
        max_length=100,
        verbose_name="nombre"
    )
    icon = models.ImageField(
        null=False,
        upload_to="",
        verbose_name="icono"
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Carpeta de páginas"
        verbose_name_plural = "Carpetas de páginas"
        ordering = ["name"]


class Page(models.Model):
    folder = models.ForeignKey(
        PageFolder,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        verbose_name="carpeta"
    )
    name = models.CharField(
        blank=False,
        null=False,
        max_length=100,
        verbose_name="nombre"
    )
    image = models.ImageField(
        null=False,
        upload_to="",
        verbose_name="imagen"
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Página"
        verbose_name_plural = "Páginas"
        ordering = ["folder__name", "name"]


class Label(models.Model):
    page = models.ForeignKey(
        Page,
        null=False,
        on_delete=models.CASCADE,
        verbose_name="página"
    )
    text = models.TextField(
        blank=False,
        null=False,
        verbose_name="texto"
    )
    x = models.PositiveSmallIntegerField(
        null=False,
        verbose_name="x"
    )
    y = models.PositiveSmallIntegerField(
        null=False,
        verbose_name="y"
    )
    color = models.CharField(
        blank=False,
        null=False,
        max_length=7,
        verbose_name="color"
    )
    font_name = models.CharField(
        blank=False,
        null=False,
        max_length=100,
        verbose_name="fuente"
    )
    font_size = models.PositiveSmallIntegerField(
        null=False,
        verbose_name="tamaño de fuente"
    )

    def __str__(self):
        return self.text

    class Meta:
        verbose_name = "Etiqueta"
        verbose_name_plural = "Etiquetas"
        ordering = ["page__id", "y", "x"]


class Profile(models.Model):
    owner = models.ForeignKey(
        User,
        null=False,
        blank=False,
        on_delete=models.CASCADE,
        verbose_name="usuario"
    )
    code = models.CharField(
        blank=False,
        null=False,
        max_length=10,
        verbose_name="codigo"
    )

    def __str__(self):
        return str(self.id)

    class Meta:
        verbose_name = "Perfil"
        verbose_name_plural = "Perfiles"
        ordering = ["owner__id", "id"]
