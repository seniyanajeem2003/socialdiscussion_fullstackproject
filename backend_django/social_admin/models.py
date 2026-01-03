from django.contrib.auth.models import AbstractBaseUser, BaseUserManager 
from django.db import models 
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

class UserManager(BaseUserManager): 
      def create_user(self, email, password=None): 
        if not email:
             raise ValueError("Users must have an email address") 
        email = self.normalize_email(email) 
        user = self.model(email=email) 
        user.set_password(password) 
        user.save(using=self._db) 
        return user 
 
      def create_superuser(self, email, password): 
        user = self.create_user(email, password) 
        user.is_admin = True 
        User.is_superuser = True 
        user.save(using=self._db) 
        return user  
 
class User(AbstractBaseUser): 
    email = models.EmailField(unique=True) 
    name = models.CharField(max_length =255) 
    bio = models.TextField(null=True, blank=True)
    profile_pic = models.ImageField( upload_to='profile_pics/',null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True) 
    is_admin = models.BooleanField(default=False) 
    followers = models.ManyToManyField('self', symmetrical=False, related_name='following', blank=True)
    blocked_users = models.ManyToManyField('self', symmetrical=False, related_name='blocked_by', blank=True)
    objects = UserManager() 
 
    USERNAME_FIELD = 'email'


class Community(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    thumbnail = models.ImageField(upload_to='community_thumbnails/',null=True,blank=True)
    creater = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='communities_created')
    members = models.ManyToManyField(settings.AUTH_USER_MODEL,related_name='communities_joined',blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    

class CommunityMembership(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('moderator', 'Moderator'),
        ('member', 'Member'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='community_memberships')
    community = models.ForeignKey('Community', on_delete=models.CASCADE,related_name='memberships')
    role = models.CharField(max_length=20,choices=ROLE_CHOICES,default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'community')
        ordering = ['-joined_at']


class Post(models.Model):
    MEDIA_TYPE_CHOICES = (
        ('image', 'Image'),
        ('video', 'Video'),
        ('none', 'None'),
    )
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('hidden', 'Hidden'),
    )
    title = models.CharField(max_length=255, blank=True, null=True)
    caption = models.TextField(blank=True, null=True)
    media_file = models.FileField(upload_to='post_media/', null=True, blank=True)
    media_type = models.CharField(max_length=20,choices=MEDIA_TYPE_CHOICES,default='none')
    community = models.ForeignKey('Community',on_delete=models.CASCADE,related_name='posts',blank=True,null=True )
    postedby = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='posts')
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=10,choices=STATUS_CHOICES,default='active')
    created_at = models.DateTimeField(auto_now_add=True)


class Comment(models.Model):
    post = models.ForeignKey('Post',on_delete=models.CASCADE,related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='comments')
    text = models.TextField()
    parent = models.ForeignKey('self',null=True,blank=True,on_delete=models.CASCADE,related_name='replies')
    is_visible = models.BooleanField(default=True) 
    created_at = models.DateTimeField(auto_now_add=True)


class Like(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="likes")
    post = models.ForeignKey('Post', on_delete=models.CASCADE, related_name='likes')
    type = models.CharField(max_length=10, choices=(('like', 'Like'), ('dislike', 'Dislike')))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post', 'type')
        ordering = ['-created_at']


class Report(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="reports")
    reported_by_name = models.CharField(max_length=150, null=True, blank=True)
    reason = models.TextField()
    date_reported = models.DateField(null=True, blank=True)
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('reported_by', 'content_type', 'object_id')


class Chat(models.Model):
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="chats")
    title = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    text = models.TextField(null=True, blank=True)
    media_url = models.URLField(max_length=500, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class TypingStatus(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='typing_statuses')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    last_seen = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('chat', 'user')
class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="actor_notifications")
    verb = models.CharField(max_length=255)
    unread = models.BooleanField(default=True)
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    target = GenericForeignKey("content_type", "object_id")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']