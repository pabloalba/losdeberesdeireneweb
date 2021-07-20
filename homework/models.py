from django.db import models

class PageFolder(models.Model):
    parent = models.ForeignKey(
        "PageFolder",
        null = True,
        on_delete = models.CASCADE,
        verbose_name = "carpeta padre"
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
        null = True,
        on_delete = models.CASCADE,
        verbose_name = "carpeta"
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

