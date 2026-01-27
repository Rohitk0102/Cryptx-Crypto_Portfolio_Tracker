from django.core.management.base import BaseCommand
from faker import Faker
import random
from api.models import User, Place, Review


class Command(BaseCommand):
    help = 'Populate database with sample data'
    
    def add_arguments(self, parser):
        parser.add_argument('--users', type=int, default=50)
        parser.add_argument('--places', type=int, default=100)
        parser.add_argument('--reviews', type=int, default=500)
        parser.add_argument('--clear', action='store_true')
    
    def handle(self, *args, **options):
        fake = Faker()
        
        if options['clear']:
            self.stdout.write('Clearing data...')
            Review.objects.all().delete()
            Place.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
        
        self.stdout.write(f"Creating {options['users']} users...")
        users = []
        for i in range(options['users']):
            try:
                user = User.objects.create_user(
                    phone_number=f"+1{fake.unique.numerify('##########')}",
                    name=fake.name(),
                    password='password123'
                )
                users.append(user)
            except:
                pass
        
        self.stdout.write(f"Creating {options['places']} places...")
        places = []
        types = ['Restaurant', 'Cafe', 'Shop', 'Doctor', 'Salon', 'Gym', 'Pharmacy']
        for i in range(options['places']):
            try:
                place = Place.objects.create(
                    name=f"{fake.company()} {random.choice(types)}",
                    address=fake.address()
                )
                places.append(place)
            except:
                pass
        
        self.stdout.write(f"Creating {options['reviews']} reviews...")
        count = 0
        for i in range(options['reviews']):
            try:
                Review.objects.create(
                    user=random.choice(users),
                    place=random.choice(places),
                    rating=random.randint(1, 5),
                    text=fake.paragraph()
                )
                count += 1
            except:
                pass
        
        self.stdout.write(self.style.SUCCESS(f'Done! Created {len(users)} users, {len(places)} places, {count} reviews'))
