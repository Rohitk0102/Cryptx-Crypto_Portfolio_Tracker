from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg
from django.db.models.functions import Lower


class UserManager(BaseUserManager):
    def create_user(self, phone_number, name, password=None, **extra_fields):
        if not phone_number:
            raise ValueError('Phone number is required')
        if not name:
            raise ValueError('Name is required')
        
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        
        user = self.model(phone_number=phone_number, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, phone_number, name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True')
        
        return self.create_user(phone_number, name, password, **extra_fields)


class User(AbstractUser):
    username = None
    phone_number = models.CharField(max_length=15, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['name']
    
    class Meta:
        db_table = 'users'
        indexes = [models.Index(fields=['phone_number'])]
    
    def __str__(self):
        return f"{self.name} ({self.phone_number})"


class Place(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'places'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['average_rating']),
        ]
        constraints = [
            models.UniqueConstraint(Lower('name'), Lower('address'), name='unique_place_name_address')
        ]
    
    def update_average_rating(self):
        avg = self.reviews.aggregate(Avg('rating'))['rating__avg']
        self.average_rating = round(avg, 2) if avg else 0.00
        self.save(update_fields=['average_rating'])
    
    def __str__(self):
        return f"{self.name} - {self.address[:50]}"


class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'reviews'
        indexes = [
            models.Index(fields=['place', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.place.update_average_rating()
    
    def __str__(self):
        return f"{self.user.name} - {self.place.name} ({self.rating}★)"
