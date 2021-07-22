from django.contrib import admin

from .models import *

class PageInline(admin.TabularInline):
    model = Page

class PageFolderAdmin(admin.ModelAdmin):
    list_display = ["name", "parent"]
    inlines = [PageInline,]

class PageAdmin(admin.ModelAdmin):
    list_display = ["name", "folder"]

admin.site.register(PageFolder, PageFolderAdmin)
admin.site.register(Page, PageAdmin)
admin.site.register(Label)
admin.site.register(Profile)
admin.site.register(StudentTeacher)

