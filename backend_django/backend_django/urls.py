"""
URL configuration for backend_django project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path
from social_admin import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.admin_login, name='admin_login'),
    path('dashboard', views.admin_home, name='admin_dashboard'),
    path('users_data', views.users_list, name='users_list'),
    path('user/<int:user_id>/', views.user_detail, name='user_detail'),
    path('communities', views.community_list, name='communities_list'),
    path('community/<int:community_id>/', views.community_detail, name='community_detail'),
    path('community/<int:community_id>/edit/', views.community_edit, name='community_edit'),
    path('community/<int:community_id>/delete/', views.community_delete, name='community_delete'),
    path('community_member/<int:community_id>/', views.community_users, name='community_member'),
    path('posts', views.post_management, name='post_management'),
    path('posts/<int:post_id>/', views.post_detail, name='post_detail'),
    path('comments', views.comment_management, name='comment_management'),
    path('reported', views.reported_management, name='reported_management'),
    path('admin_create', views.create_community, name='admin_create_community'),
    path('admin_view', views.admin_settings, name='admin_settings'),
    path('change_pswrd', views.admin_change_password, name='admin_change_password'),
    path('logout', views.admin_logout, name='admin_logout'),

#------------------------------------API------------------------------------------------------------------------#
    path('api/signup', views.Signup, name='signup_page'),
    path('api/login', views.login_api, name='login_page'),
    path('api/profile', views.get_profile, name='profile'),
    path('api/latest_post', views.latest_posts, name='latest_posts'),
    path('api/popular_posts', views.popular_posts, name='popular_posts'),
    path('api/trending_posts', views.trending_posts, name='trending_posts'),
    path('api/stream_posts', views.stream_posts, name='stream_posts'),
    path('api/like_dislike/<int:post_id>', views.like_post, name='like_post'),
    path('api/comment/<int:post_id>', views.add_comment, name='add_comment'),
    path('api/create_posts', views.create_post, name='create_post'),
    path('api/create_communities', views.create_community_with_post, name='create_community'),
    path('api/toggle_membership/<int:community_id>', views.toggle_community_membership, name='join_community'),  
    path('api/community/<int:community_id>', views.get_community, name='get_community'),
    path('api/community_posts/<int:community_id>', views.community_posts, name='community_posts'),
    path('api/get_comment/<int:post_id>', views.post_comments, name='get_comments'),
    path('api/discover_communities', views.discover_communities, name='discover_communities'),
    path('api/report_chat/<int:chat_id>', views.report_chat, name='report_chat'),
    path('api/report_post/<int:post_id>', views.report_post, name='report_post'),
    path('api/report_comment/<int:comment_id>', views.report_comment, name='report_comment'),
    path('api/delete_comment/<int:comment_id>', views.delete_comment, name='delete_comment'),
    path('api/delete_post/<int:post_id>', views.delete_post, name='delete_post'),
    path('api/get_post_details/<int:post_id>/', views.get_post_detail, name='post_details'),
    path('api/update_profile', views.update_profile, name='update_profile'),
    path('api/profile_picture_update', views.update_profile_picture, name='change_picture'),
    path('api/submit_report', views.submit_report, name='submit_report'),
    path('api/my_posts', views.my_posts, name='my_posts'),
    path('api/my_created_communities', views.my_created_communities, name='my_created_communities'),
    path('api/my_joined_communities', views.my_joined_communities, name='my_joined_communities'),
    path('api/user_posts/<int:user_id>/', views.user_posts, name='user_posts'),
    path('api/user_communities/<int:user_id>/', views.user_communities, name='user_communities'),
    path('api/edit_post/<int:post_id>/', views.edit_post, name='edit_post'),
    path('api/update_community/<int:community_id>/', views.update_community, name='update_community'),
    path('api/logout', views.logout_user, name='logout_user'),
    path('api/recently_viewed_posts', views.recently_viewed_posts, name='recently_viewed_posts'),
    path('api/user_profile/<int:user_id>/', views.user_profile, name='user_profile'),
    path('api/follow/<int:user_id>', views.follow_user, name='follow_user'),
    path('api/block/<int:user_id>', views.block_user, name='block_user'),
    path('api/profile_dashboard', views.profile_dashboard_full, name='profile_dashboard'),
    path('api/change_password', views.change_password, name='change_password'),
    path('api/chats_view', views.chats_view, name='chats_view'),
    path('api/send_message/<int:chat_id>/', views.send_message, name='send_message_api'),
    path('api/get_messages/<int:chat_id>/', views.get_messages, name='get_messages'),
    path('api/mark_read/<int:chat_id>/', views.mark_read, name='mark_read'),
    path('api/delete_message/<int:message_id>/', views.delete_message, name='delete_message'),
    path('api/delete_chat/<int:chat_id>/', views.delete_chat, name='delete_chat'),
    path('api/typing/<int:chat_id>/', views.typing_status_view, name='typing'),
    path('api/get_typing/<int:chat_id>/', views.get_typing_status, name='get_typing'),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)