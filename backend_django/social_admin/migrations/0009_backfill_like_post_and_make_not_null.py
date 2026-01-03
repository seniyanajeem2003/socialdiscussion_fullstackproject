from django.db import migrations, models
import django.db.models.deletion


def forwards(apps, schema_editor):
    Like = apps.get_model('social_admin', 'Like')
    Post = apps.get_model('social_admin', 'Post')
    ContentType = apps.get_model('contenttypes', 'ContentType')

    try:
        post_ct = ContentType.objects.get(app_label='social_admin', model='post')
    except ContentType.DoesNotExist:
        post_ct = None

    # For any Like records that don't yet have post set, try to map them
    for like in Like.objects.filter(post__isnull=True):
        # If this like originally pointed to a Post via content_type/object_id, use that
        if post_ct and getattr(like, 'content_type_id', None) == post_ct.id and like.object_id:
            try:
                post = Post.objects.get(id=like.object_id)
                like.post_id = post.id
                like.save()
            except Post.DoesNotExist:
                # Cannot map - remove the like to keep DB clean
                like.delete()
        else:
            # Unknown target - remove orphaned like records
            like.delete()


def backwards(apps, schema_editor):
    # We cannot reliably restore previous content_type/object_id state for likes that were migrated/deleted.
    # Leave backward migration as a no-op (safe fallback).
    return


class Migration(migrations.Migration):

    dependencies = [
        ('social_admin', '0008_add_post_and_type_to_like'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
        migrations.AlterField(
            model_name='like',
            name='post',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='likes', to='social_admin.post'),
        ),
    ]
