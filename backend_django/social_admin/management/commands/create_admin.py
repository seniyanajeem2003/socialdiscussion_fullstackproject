from django.core.management.base import BaseCommand
from social_admin.models import User
from getpass import getpass

class Command(BaseCommand):
    help = "Create an admin user"

    def handle(self, *args, **kwargs):
        email = input("Enter admin email: ")
        name = input("Enter admin name: ")
        password = getpass("Enter admin password: ")

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.ERROR("Admin already exists"))
            return

        admin = User.objects.create_user(
            email=email,
            password=password
        )
        admin.name = name
        admin.is_admin = True
        admin.save()

        self.stdout.write(self.style.SUCCESS("Admin created successfully"))
