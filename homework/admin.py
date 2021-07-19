from django.contrib import admin

from .models import *

class PageInline(admin.TabularInline):
    model = Page

class PageFolderAdmin(admin.ModelAdmin):
    list_display = ["name"]
    inlines = [PageInline,]

class PageAdmin(admin.ModelAdmin):
    list_display = ["name"]

admin.site.register(PageFolder, PageFolderAdmin)
admin.site.register(Page, PageAdmin)

