from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Place, Review


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin for User model with phone_number authentication.
    """
    list_display = ['phone_number', 'name', 'is_staff', 'is_active', 'date_joined']
    list_filter = ['is_staff', 'is_active', 'date_joined']
    search_fields = ['phone_number', 'name']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('phone_number', 'password')}),
        ('Personal Info', {'fields': ('name', 'email')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone_number', 'name', 'password1', 'password2'),
        }),
    )


@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    """
    Admin interface for Place model.
    """
    list_display = ['name', 'address_short', 'average_rating', 'created_at']
    list_filter = ['average_rating', 'created_at']
    search_fields = ['name', 'address']
    readonly_fields = ['average_rating', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    def address_short(self, obj):
        """Display shortened address in list view."""
        return obj.address[:50] + '...' if len(obj.address) > 50 else obj.address
    address_short.short_description = 'Address'


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """
    Admin interface for Review model.
    """
    list_display = ['user', 'place', 'rating', 'text_short', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['user__name', 'user__phone_number', 'place__name', 'text']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    
    def text_short(self, obj):
        """Display shortened review text in list view."""
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    text_short.short_description = 'Review Text'
