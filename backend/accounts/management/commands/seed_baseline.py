from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

from config.constants import ROLE_ADMIN, ROLE_MANAGER, ROLE_STUDENT
from hostels.models import Hostel, RoomType


class Command(BaseCommand):
    help = "Seed baseline roles and sample hostel data"

    def handle(self, *args, **options):
        for role in (ROLE_ADMIN, ROLE_MANAGER, ROLE_STUDENT):
            Group.objects.get_or_create(name=role)

        User = get_user_model()
        admin_email = "admin@kisubi.ac.ug"
        if not User.objects.filter(email=admin_email).exists():
            user = User.objects.create_superuser(
                email=admin_email,
                password="Admin123!",
                full_name="System Admin",
                role=ROLE_ADMIN,
            )
            group = Group.objects.get(name=ROLE_ADMIN)
            user.groups.add(group)
            self.stdout.write(self.style.SUCCESS("Created default admin: admin@kisubi.ac.ug / Admin123!"))

        RoomType.objects.get_or_create(code="STD", defaults={"name": "Standard", "description": "Standard room", "monthly_fee": 250000})
        RoomType.objects.get_or_create(code="DLX", defaults={"name": "Deluxe", "description": "Deluxe room", "monthly_fee": 350000})

        Hostel.objects.get_or_create(
            code="M-HOSTEL",
            defaults={"name": "Men Hostel", "sex_restriction": "MALE", "capacity": 100, "active": True},
        )
        Hostel.objects.get_or_create(
            code="F-HOSTEL",
            defaults={"name": "Women Hostel", "sex_restriction": "FEMALE", "capacity": 120, "active": True},
        )

        self.stdout.write(self.style.SUCCESS("Baseline data seeded."))
