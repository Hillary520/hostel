from django.contrib import admin

from .models import StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("student_no", "user", "program", "year_of_study", "registration_status")
    list_filter = ("registration_status", "year_of_study")
    search_fields = ("student_no", "user__full_name", "user__email", "program")
